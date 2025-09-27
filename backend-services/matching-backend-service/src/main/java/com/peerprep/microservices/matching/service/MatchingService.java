package com.peerprep.microservices.matching.service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.peerprep.microservices.matching.dto.MatchNotification;
import com.peerprep.microservices.matching.dto.MatchRedisResult;
import com.peerprep.microservices.matching.dto.UserPreferenceRequest;
import com.peerprep.microservices.matching.dto.UserPreferenceResponse;
import com.peerprep.microservices.matching.exception.ExistingPendingMatchRequestException;
import com.peerprep.microservices.matching.exception.NoPendingMatchRequestException;
import com.peerprep.microservices.matching.model.UserPreference;
import com.peerprep.microservices.matching.repository.MatchingRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class MatchingService {

  private final MatchingRepository userPreferenceRepository;
  private final RedisMatchService redisMatchService;
  private final UserPreferenceService userPreferenceService;
  private final RedisTemplate<String, Object> redisTemplate;
  private final ObjectMapper objectMapper;

  /**
   * Waiting futures is still needed so we can remove users from cache when
   * timeout happens
   */
  private final Map<String, CompletableFuture<UserPreferenceResponse>> waitingFutures = new ConcurrentHashMap<>();
  private final Map<String, String> userRequestIds = new ConcurrentHashMap<>();
  private final Map<String, String> requestToUser = new ConcurrentHashMap<>();

  private static final String MATCH_CHANNEL = "match-notifications";
  private static final String CANCEL_CHANNEL = "cancel-notifications";

  // ---------- [Matching] ----------

  /**
   * Attempt to find a match for a user asynchronously within a given time frame.
   *
   * If a match exists in the pool, the method completes immediately.
   * Otherwise, the user is added to the pool and wait until a compatible match is
   * found or timeout expires.
   *
   * @param request   The {@link UserPreferenceRequest} of the user requesting a
   *                  match.
   * @param timeoutMs Maximum time in milliseconds to wait for a match.
   * @return {@link CompletableFuture} that completes with a
   *         {@link UserPreferenceResponse}
   *         if a match is found, or {@code null} if the request times out.
   * @throws ExistingPendingMatchRequestException if the user already has a
   *                                              pending match request.
   */
  public CompletableFuture<UserPreferenceResponse> requestMatchAsync(UserPreferenceRequest request, long timeoutMs) {
    UserPreference pref = userPreferenceService.mapToUserPreference(request);
    String userId = pref.getUserId();
    String requestId = UUID.randomUUID().toString(); // generate unique request id
    log.info("User {} is requesting a match with requestId {}", userId, requestId);

    CompletableFuture<UserPreferenceResponse> future = new CompletableFuture<>();

    // Call Lua script with requestId embedded
    MatchRedisResult matchRedisResult = redisMatchService.match(pref, requestId);

    // Use RedisMatchService to match or add to pool and if old request was deleted
    Assert.notNull(matchRedisResult, "Redis script returned null");

    String oldRequestId = matchRedisResult.getOldRequestId();
    Boolean oldDeleted = matchRedisResult.isOldRequestDeleted();

    // If old request was deleted, notify other instances to cancel the future with
    // the oldRequestId.
    if (oldDeleted) {
      redisTemplate.convertAndSend(CANCEL_CHANNEL, oldRequestId);
      log.info("Notified other instances to cancel previous request for user {}", userId);
      log.info("Previous match request for user {} was removed", userId);
    }

    UserPreference matchedPref = matchRedisResult.getMatched();
    String matchedRequestId = matchRedisResult.getMatchedRequestId();

    // Match found immediately
    if (matchedPref != null) {
      log.info("Match found immediately for user {} with requestId {}. matched with user {}",
          userId, requestId, matchedPref.getUserId());
      // Publish notification to all instances
      MatchNotification matchResult = new MatchNotification(requestId, matchedRequestId, pref, matchedPref);
      publishMatchNotification(matchResult);

      // Complete this instance's future immediately
      future.complete(userPreferenceService.mapToResponse(matchedPref));
      return future;
    }

    // No match found - user added to pool, store future for later completion
    waitingFutures.put(requestId, future);
    userRequestIds.put(userId, requestId);
    requestToUser.put(requestId, userId);
    log.info("No match found immediately for user {}, added to pool with requestId {}", userId, requestId);

    // Timeout handling
    CompletableFuture.delayedExecutor(timeoutMs, TimeUnit.MILLISECONDS).execute(() -> {
      if (!future.isDone()) {
        boolean removed = redisMatchService.remove(userId);
        waitingFutures.remove(requestId);
        future.complete(null);
        log.info("User {} match request has timed out", userId);
      }
    });
    return future;
  }

  /**
   * Cancel a pending match request for a given user.
   *
   * @param userId The ID of the user canceling their match request.
   * @throws NoPendingMatchRequestException if no pending request exists
   */
  public void cancelMatchRequest(String userId) {
    String requestId = userRequestIds.get(userId);
    if (requestId == null) {
      throw new NoPendingMatchRequestException(userId);
    }

    publishCancelNotification(requestId);
    log.info("Cancelled match request for user {} with requestId {}", userId, requestId);
  }

  // ---------- [Event Handlers] ----------
  private void publishMatchNotification(MatchNotification matchResult) {
    try {
      String message = objectMapper.writeValueAsString(matchResult);
      redisTemplate.convertAndSend(MATCH_CHANNEL, message);
      log.info("Published match result for users {} and {}",
          matchResult.getUser1Preference().getUserId(),
          matchResult.getUser2Preference().getUserId());
    } catch (JsonProcessingException e) {
      log.error("Failed to publish match result", e);
    }
  }

  private void publishCancelNotification(String userId) {
    redisTemplate.convertAndSend(CANCEL_CHANNEL, userId);
    log.info("Published match cancel notification for user {}", userId);
  }

  public void handleMatchNotification(MatchNotification matchResult) {
    String user1RequestId = matchResult.getUser1RequestId();
    String user2RequestId = matchResult.getUser2RequestId();
    UserPreference user1Pref = matchResult.getUser1Preference();
    UserPreference user2Pref = matchResult.getUser2Preference();
    String user1Id = user1Pref.getUserId();
    String user2Id = user2Pref.getUserId();

    log.info("Handling match notification for users {} and {}",
        user1Id,
        user2Id);
    log.info("Request IDs: {} and {}", user1RequestId, user2RequestId);

    CompletableFuture<UserPreferenceResponse> future1 = waitingFutures.get(user1RequestId);
    CompletableFuture<UserPreferenceResponse> future2 = waitingFutures.get(user2RequestId);

    log.info("Futures: {}, {}", future1, future2);

    if (future1 != null && !future1.isDone()) {
      log.info("Completing future for user {} via pub/sub", user1Id);
      UserPreference overlappingPreference = user1Pref.getOverlap(user2Pref);
      UserPreferenceResponse user1Response = userPreferenceService.mapToResponse(overlappingPreference);
      future1.complete(user1Response);
      waitingFutures.remove(user1RequestId);
      log.info("Completed future for user {} via pub/sub", user1Id);
    }

    if (future2 != null && !future2.isDone()) {
      log.info("Completing future for user {} via pub/sub", user2Id);
      UserPreference overlappingPreference = user2Pref.getOverlap(user1Pref);
      UserPreferenceResponse user2Response = userPreferenceService.mapToResponse(overlappingPreference);
      future2.complete(user2Response);
      waitingFutures.remove(user2RequestId);
      log.info("Completed future for user {} via pub/sub", user2Id);
    }
  }

  // Cancels a pending match request due to a cancel-notification event
  public void handleCancelNotification(String oldRequestId) {

    CompletableFuture<UserPreferenceResponse> oldFuture = waitingFutures.get(oldRequestId);
    if (oldFuture == null) {
      log.info("Cancel-notification ignored: no pending request with requestId {}", oldRequestId);
      return;
    }

    oldFuture.complete(null);
    String userId = requestToUser.remove(oldRequestId);
    if (userId != null) {
      userRequestIds.remove(userId);
    }

    log.info("Cancelled old match request with requestId {}", oldRequestId);
  }

}
