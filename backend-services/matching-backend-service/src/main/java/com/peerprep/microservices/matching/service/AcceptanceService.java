package com.peerprep.microservices.matching.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.peerprep.microservices.matching.client.CollabServiceClient;
import com.peerprep.microservices.matching.config.MatchingTimeoutConfig;
import com.peerprep.microservices.matching.config.RedisChannels;
import com.peerprep.microservices.matching.dto.AcceptanceNotification;
import com.peerprep.microservices.matching.dto.MatchAcceptanceOutcome;
import com.peerprep.microservices.matching.dto.MatchAcceptanceStatus;
import com.peerprep.microservices.matching.dto.MatchAcceptanceStatus.AcceptanceStatus;
import com.peerprep.microservices.matching.model.QuestionPreference;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for handling match acceptance logic.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AcceptanceService {

  private final RedisAcceptanceService redisAcceptanceService;
  private final RedisTemplate<String, Object> redisTemplate;
  private final MatchingTimeoutConfig timeoutConfig;
  private final CollabServiceClient collabServiceClient;

  /*
   * Map of userId to CompletableFuture for pending match acceptance requests.
   */
  private final Map<String, CompletableFuture<MatchAcceptanceOutcome.Status>> matchedWaitingFutures = new ConcurrentHashMap<>();

  /**
   * Connects a user to a match acceptance.
   *
   * @param userId the ID of the user to connect
   * @param matchId the ID of the match to connect to
   * @return the match acceptance outcome
   */
  public CompletableFuture<MatchAcceptanceOutcome.Status> connectMatch(String userId, String matchId) {

    log.info("Connecting User {} to match {}..", userId, matchId);

    CompletableFuture<MatchAcceptanceOutcome.Status> connectFuture = new CompletableFuture<>();

    MatchAcceptanceStatus updated = redisAcceptanceService.updateAcceptance(
      matchId,
      userId,
      AcceptanceStatus.CONNECTED,
      RedisChannels.MATCH_ACCEPTANCE_CHANNEL);

    if (updated == null) {
      throw new IllegalArgumentException("No such match: " + matchId);
    }

    MatchAcceptanceOutcome.Status finalStatus = evaluateMatchOutcome(updated);

    // Complete future if outcome already determined.
    if (finalStatus != MatchAcceptanceOutcome.Status.PENDING) {
      log.info("Match {} was rejected. Completing future.", matchId);
      connectFuture.complete(finalStatus);
    }

    matchedWaitingFutures.put(userId, connectFuture);
    log.info("Connected User {} to match {}", userId, matchId);

    // Timeout handling
    long timeoutMs = timeoutConfig.getMatchAcceptance();
    CompletableFuture.delayedExecutor(timeoutMs, TimeUnit.MILLISECONDS).execute(() -> {
      if (!connectFuture.isDone()) {
        log.warn("User {}'s connection to match {} timed out after {} ms. Rejecting..", userId, matchId, timeoutMs);

        rejectMatch(userId, matchId);

        log.info("User {}'s connect future for match {} marked as REJECTED due to timeout", userId, matchId);
      }
    });

    return connectFuture;
  }

  /**
   * Accepts a match for a specified user.
   *
   * @param userId the ID of the accepting user
   * @param matchId the ID of the match the user is accepting
   * @return the updated match acceptance status
   */
  public MatchAcceptanceStatus acceptMatch(String userId, String matchId) {
    log.info("User {} accepted match {}", userId, matchId);

    MatchAcceptanceStatus updated = redisAcceptanceService.updateAcceptance(
      matchId,
      userId,
      AcceptanceStatus.ACCEPTED,
      RedisChannels.MATCH_ACCEPTANCE_CHANNEL);

    if (updated == null) {
      throw new IllegalArgumentException("No such match: " + matchId);
    }

    MatchAcceptanceOutcome.Status finalStatus = evaluateMatchOutcome(updated);

    // If accepted, builds a collab session
    if (finalStatus == MatchAcceptanceOutcome.Status.SUCCESS) {
      buildCollabSession(updated);
    }

    // If accepted or refected, sends a publishAcceptanceNotification
    if (finalStatus != MatchAcceptanceOutcome.Status.PENDING) {
      String userId1 = updated.getMatchDetails().getUser1Id();
      String userId2 = updated.getMatchDetails().getUser2Id();
      publishAcceptanceNotification(userId1, userId2, finalStatus);
    }

    return updated;
  }

  /**
   * Rejects a match for a specified user.
   *
   * @param userId the ID of the user rejecting the match
   * @param matchId the ID of the match to reject
   * @return the updated match acceptance status
   */
  public MatchAcceptanceStatus rejectMatch(String userId, String matchId) {
    log.info("User {} rejecting match {}", userId, matchId);

    MatchAcceptanceStatus updated = redisAcceptanceService.updateAcceptance(
      matchId,
      userId,
      AcceptanceStatus.REJECTED,
      RedisChannels.MATCH_ACCEPTANCE_CHANNEL);

    if (updated == null) {
      throw new IllegalArgumentException("No such match: " + matchId);
    }

    MatchAcceptanceOutcome.Status finalStatus = evaluateMatchOutcome(updated);
    if (finalStatus != MatchAcceptanceOutcome.Status.PENDING) {
      String userId1 = updated.getMatchDetails().getUser1Id();
      String userId2 = updated.getMatchDetails().getUser2Id();
      publishAcceptanceNotification(userId1, userId2, finalStatus);
    }

    log.info("User {} rejected match {}", userId, matchId);
    return updated;
  }

  // ---------- [Event Handlers] ----------
  /**
   * Publishes a match acceptance notification to the Redis channel.
   * 
   * @param user1Id the user ID of the first user in the match acceptance
   * @param user2Id the user ID of the second user in the match acceptance
   * @param status the status of the match acceptance
   */
  private void publishAcceptanceNotification(String user1Id, String user2Id, MatchAcceptanceOutcome.Status status) {
    log.info("Publishing acceptance notification for match status {} to users {} and {}", status, user1Id, user2Id);
    AcceptanceNotification acceptanceNotification = new AcceptanceNotification(user1Id, user2Id, status);

    redisTemplate.convertAndSend(RedisChannels.MATCH_ACCEPTANCE_CHANNEL, acceptanceNotification);
  }

  /**
   * Handles the acceptance notification event.
   * 
   * @param acceptanceNotification the acceptance notification event
   */
  public void handleAcceptanceNotification(AcceptanceNotification acceptanceNotification) {

    String user1Id = acceptanceNotification.getUser1Id();
    String user2Id = acceptanceNotification.getUser2Id();
    log.info("Handling acceptance event for users {} and {}", user1Id, user2Id);

    CompletableFuture<MatchAcceptanceOutcome.Status> user1Future = matchedWaitingFutures.get(user1Id);
    CompletableFuture<MatchAcceptanceOutcome.Status> user2Future = matchedWaitingFutures.get(user2Id);

    MatchAcceptanceOutcome.Status matchStatus = acceptanceNotification.getStatus();

    if (matchStatus == MatchAcceptanceOutcome.Status.PENDING) {
      log.info("Pending Acceptance Status does not complete request");
      return;
    }

    if (user1Future != null && !user1Future.isDone()) {
      user1Future.complete(matchStatus);
    }

    if (user2Future != null && !user2Future.isDone()) {
      user2Future.complete(matchStatus);
    }

    log.info("Handled acceptance event for users {} and {}", user1Id, user2Id);
  }

  private void buildCollabSession(MatchAcceptanceStatus status) {

    log.debug("Match details: {}", status.getMatchDetails());

    List<String> participants = new ArrayList<>();
    Map<String, List<String>> preferenceMap = toPreferenceMap(status);
    participants.add(status.getMatchDetails().getUser1Id());
    participants.add(status.getMatchDetails().getUser2Id());

    collabServiceClient.createSession(participants, preferenceMap);

    log.info("Created collaboration session for match {}", status.getMatchDetails().getMatchId());
  }

  private Map<String, List<String>> toPreferenceMap(MatchAcceptanceStatus status) {
    QuestionPreference preference = status.getMatchDetails().getQuestionPreference();

    if (preference == null || preference.getTopics() == null || preference.getTopics().isEmpty()) {
      throw new IllegalStateException(
        "Question preferences are required to create a collaboration session for match "
          + status.getMatchDetails().getMatchId());
    }

    Map<String, List<String>> mapped = new HashMap<>();
    preference.getTopics().forEach((topic, difficulties) -> {
      if (difficulties != null && !difficulties.isEmpty()) {
        mapped.put(topic, new ArrayList<>(difficulties));
      }
    });

    return mapped;
  }

  /**
   * Helper to determine the overall match acceptance result.
   *
   * @param status the MatchAcceptanceStatus to check
   * @return "SUCCESS" if both accepted, "REJECTED" if one rejected, or "PENDING" otherwise
   */
  private MatchAcceptanceOutcome.Status evaluateMatchOutcome(MatchAcceptanceStatus status) {
    if (status == null) {
      throw new IllegalArgumentException("MatchAcceptanceStatus cannot be null");
    }

    var user1 = status.getUser1Accepted();
    var user2 = status.getUser2Accepted();

    if (user1 == AcceptanceStatus.REJECTED || user2 == AcceptanceStatus.REJECTED) {
      return MatchAcceptanceOutcome.Status.REJECTED;
    }

    if (user1 == AcceptanceStatus.ACCEPTED && user2 == AcceptanceStatus.ACCEPTED) {
      return MatchAcceptanceOutcome.Status.SUCCESS;
    }

    return MatchAcceptanceOutcome.Status.PENDING;

  }
}
