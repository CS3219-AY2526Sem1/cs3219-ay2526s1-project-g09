package com.peerprep.microservices.matching.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.connection.ReturnType;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.peerprep.microservices.matching.dto.UserPreferenceRequest;
import com.peerprep.microservices.matching.dto.UserPreferenceResponse;
import com.peerprep.microservices.matching.exception.ExistingPendingMatchRequestException;
import com.peerprep.microservices.matching.exception.NoPendingMatchRequestException;
import com.peerprep.microservices.matching.exception.UserPreferenceNotFoundException;
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

  /**
   * Waiting futures is still needed so we can remove users from cache when
   * timeout happens
   */
  private final Map<String, CompletableFuture<UserPreferenceResponse>> waitingFutures = new ConcurrentHashMap<>();

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

    CompletableFuture<UserPreferenceResponse> future = new CompletableFuture<>();

    // Use RedisMatchService to match or add to pool
    UserPreference matchedPref = redisMatchService.match(pref);
    if (matchedPref != null) {
      CompletableFuture<UserPreferenceResponse> otherFuture = waitingFutures.remove(matchedPref.getUserId());
      otherFuture.complete(userPreferenceService.mapToResponse(pref));
      future.complete(userPreferenceService.mapToResponse(matchedPref));
      return future;
    }
    waitingFutures.put(userId, future);

    // Timeout handling
    CompletableFuture.delayedExecutor(timeoutMs, TimeUnit.MILLISECONDS).execute(() -> {
      if (!future.isDone()) {
        cancelMatchRequest(userId);
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
    boolean removed = redisMatchService.remove(userId);
    if (!removed) {
      throw new NoPendingMatchRequestException(userId);
    }

    CompletableFuture<UserPreferenceResponse> future = waitingFutures.remove(userId);
    if (future != null && !future.isDone()) {
      future.complete(null);
    }

    log.info("User {} canceled their match request", userId);
  }
}
