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
import com.peerprep.microservices.matching.config.RedisChannels;
import com.peerprep.microservices.matching.dto.MatchAcceptanceStatus;
import com.peerprep.microservices.matching.dto.MatchDetails;
import com.peerprep.microservices.matching.dto.MatchingNotification;
import com.peerprep.microservices.matching.dto.MatchingRedisResult;
import com.peerprep.microservices.matching.dto.RemoveMatchingResult;
import com.peerprep.microservices.matching.dto.MatchingOutcome;
import com.peerprep.microservices.matching.dto.UserPreferenceRequest;
import com.peerprep.microservices.matching.dto.UserPreferenceResponse;
import com.peerprep.microservices.matching.exception.NoPendingMatchRequestException;
import com.peerprep.microservices.matching.model.UserPreference;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for handling user matching logic, including match requests,
 * cancellations, and processing match notifications.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MatchingService {

  private final RedisMatchingService redisMatchService;
  private final RedisAcceptanceService redisAcceptanceService;
  private final AcceptanceService acceptanceService;
  private final UserPreferenceService userPreferenceService;
  private final RedisTemplate<String, Object> redisTemplate;
  private final RedisChannels channels;
  private final ObjectMapper objectMapper;

  /*
   * Map of requestId to CompletableFuture for pending match requests.
   */
  private final Map<String, CompletableFuture<MatchingOutcome>> waitingFutures = new ConcurrentHashMap<>();

  // ---------- [Matching] ----------
  /**
   * Attempt to find a match for a user asynchronously within a given time frame.
   *
   * If a match exists in the pool, the future completes immediately.
   * Otherwise, the user is added to the pool and wait until a compatible match is
   * found or timeout expires.
   *
   * @param request   The {@link UserPreferenceRequest} of the user requesting a
   *                  match.
   * @param timeoutMs Maximum time in milliseconds to wait for a match.
   * @return {@link CompletableFuture} that completes with a
   *         {@link MatchingOutcome}
   */
  public CompletableFuture<MatchingOutcome> requestMatchAsync(UserPreferenceRequest request, long timeoutMs) {
    UserPreference pref = userPreferenceService.mapToUserPreference(request);
    String userId = pref.getUserId();
    String requestId = UUID.randomUUID().toString();
    log.info("User {} is requesting a match with requestId {}", userId, requestId);

    // Rejects existing match acceptance from matched pool
    String matchedId = redisAcceptanceService.getMatchIdFromUserId(userId);
    if (matchedId != null) {
      acceptanceService.rejectMatch(userId, matchedId);
    }

    CompletableFuture<MatchingOutcome> future = new CompletableFuture<>();

    // Use RedisMatchService to match or add to pool and if old request was deleted
    MatchingRedisResult matchRedisResult = redisMatchService.match(pref, requestId);

    Assert.notNull(matchRedisResult, "Redis script returned null");

    String oldRequestId = matchRedisResult.getOldRequestId();
    Boolean oldDeleted = matchRedisResult.isOldRequestDeleted();

    // If old request was deleted, notify other instances to cancel the old pending
    // match request
    if (oldDeleted) {
      redisTemplate.convertAndSend(channels.CANCEL_CHANNEL, oldRequestId);
      log.info("Previous match request for user {} was removed. Notified other instances to cancel the old request",
          userId);
    }

    UserPreference matchedPref = matchRedisResult.getMatched();
    String matchedRequestId = matchRedisResult.getMatchedRequestId();

    waitingFutures.put(requestId, future);

    // Match found immediately
    if (matchedPref != null) {
      log.info("Match found immediately for user {} with requestId {}. matched with user {}",
          userId, requestId, matchedPref.getUserId());

      // Save match details to match acceptance
      String matchId = UUID.randomUUID().toString();
      MatchDetails matchDetails = new MatchDetails(
          matchId,
          pref.getUserId(),
          matchedPref.getUserId(),
          pref.getQuestionPreference());

      MatchAcceptanceStatus acceptanceStatus = new MatchAcceptanceStatus(
          matchDetails,
          MatchAcceptanceStatus.AcceptanceStatus.PENDING,
          MatchAcceptanceStatus.AcceptanceStatus.PENDING);

      redisAcceptanceService.saveMatchAcceptanceDetails(
          acceptanceStatus,
          userId,
          matchedPref.getUserId());

      // Publish matched notification to all instances
      MatchingNotification matchResult = new MatchingNotification(
          requestId,
          matchedRequestId,
          pref,
          matchedPref,
          matchId);
      publishMatchNotification(matchResult);

      return future;
    }

    // No match found. User added to pool and stored future for later completion
    log.info("No match found immediately for user {} with requestId {}", userId, requestId);

    // Timeout handling
    CompletableFuture.delayedExecutor(timeoutMs, TimeUnit.MILLISECONDS).execute(() -> {
      if (!future.isDone()) {
        RemoveMatchingResult removeResult = redisMatchService.remove(userId);

        if (removeResult.removed()) {
          log.info("User {} removed from pool due to timeout", userId);
        } else {
          log.warn("User {} was not in pool during timeout cleanup", userId);
        }

        waitingFutures.remove(requestId);
        future.complete(new MatchingOutcome(MatchingOutcome.Status.TIMEOUT, null, null));
        log.info("User {} match request has timed out", userId);
      }
    });
    return future;
  }

  /**
   * Cancel a pending match request for a given user.
   *
   * @param userId The Id of the user canceling their match request.
   * @throws NoPendingMatchRequestException if no pending request exists
   */
  public void cancelMatchRequest(String userId) {
    RemoveMatchingResult removeResult = redisMatchService.remove(userId);

    if (!removeResult.removed()) {
      throw new NoPendingMatchRequestException(userId);
    }

    String requestId = removeResult.requestId();

    // Notify all instances to cancel the request
    publishCancelNotification(userId, requestId);

    log.info("Cancelled match request for user {}", userId);
  }

  // ---------- [Event Handlers] ----------

  /**
   * Publish a matched notification event to all instances when a match is found.
   * 
   * @param matchResult The matched notification details.
   */
  private void publishMatchNotification(MatchingNotification matchResult) {
    try {
      String message = objectMapper.writeValueAsString(matchResult);
      redisTemplate.convertAndSend(channels.MATCH_CHANNEL, message);
      log.info("Published match result for users {} and {}",
          matchResult.getUser1Preference().getUserId(),
          matchResult.getUser2Preference().getUserId());
    } catch (JsonProcessingException e) {
      log.error("Failed to publish match result", e);
    }
  }

  /**
   * Publish a cancel notification event to all instances to cancel a pending
   * match
   * request.
   * 
   * @param userId    The Id of the user canceling their match request.
   * @param requestId The Id of the match request being canceled.
   */
  private void publishCancelNotification(String userId, String requestId) {
    redisTemplate.convertAndSend(channels.CANCEL_CHANNEL, requestId);
    log.info("Published match cancel notification for user {} with requestId {}", userId, requestId);
  }

  /**
   * Handles a matched notification event from Redis Pub/Sub. Completes the
   * corresponding futures for both users if they exist.
   * 
   * @param matchResult The matched notification details.
   */
  public void handleMatchNotification(MatchingNotification matchResult) {
    String matchId = matchResult.getMatchId();

    String user1RequestId = matchResult.getUser1RequestId();
    String user2RequestId = matchResult.getUser2RequestId();
    UserPreference user1Pref = matchResult.getUser1Preference();
    UserPreference user2Pref = matchResult.getUser2Preference();
    String user1Id = user1Pref.getUserId();
    String user2Id = user2Pref.getUserId();

    log.info("Handling match notification for users {} and {}", user1Id, user2Id);
    log.info("Request IDs: {} and {}", user1RequestId, user2RequestId);

    CompletableFuture<MatchingOutcome> future1 = waitingFutures.remove(user1RequestId);
    CompletableFuture<MatchingOutcome> future2 = waitingFutures.remove(user2RequestId);

    completeUserFuture(user1Pref, user2Pref, future1, matchId);
    completeUserFuture(user2Pref, user1Pref, future2, matchId);
  }

  /**
   * Completes a user's match future with MATCHED status if the future exists and
   * is not already completed.
   * 
   * @param userPreference    The preference of the user whose future is to be
   *                          completed.
   * @param future            The CompletableFuture to complete.
   * @param matchedPreference The preference of the matched user.
   */
  private void completeUserFuture(UserPreference userPreference, UserPreference matchedPreference,
      CompletableFuture<MatchingOutcome> future, String matchId) {
    String userId = userPreference.getUserId();

    if (future == null || future.isDone()) {
      log.warn("No pending future found for user {}", userId);
      return;
    }

    UserPreference overlappingPreference = userPreference.getOverlap(matchedPreference);
    UserPreferenceResponse userPreferenceResponse = userPreferenceService.mapToResponse(overlappingPreference);
    future.complete(new MatchingOutcome(MatchingOutcome.Status.MATCHED, userPreferenceResponse, matchId));

    log.info("Completed future for user {} via pub/sub", userId);
  }

  /**
   * Handles a cancel notification event from Redis Pub/Sub. Completes the
   * corresponding future with CANCELLED status if it exists.
   * 
   * @param oldRequestId The Id of the match request being canceled.
   */
  public void handleCancelNotification(String oldRequestId) {

    CompletableFuture<MatchingOutcome> oldFuture = waitingFutures.get(oldRequestId);
    if (oldFuture == null) {
      log.info("Cancel-notification ignored: no pending request with requestId {}", oldRequestId);
      return;
    }

    if (oldFuture != null && !oldFuture.isDone()) {
      oldFuture.complete(new MatchingOutcome(MatchingOutcome.Status.CANCELLED, null, null));
    }

    log.info("Cancelled old match request with requestId {}", oldRequestId);
  }

}
