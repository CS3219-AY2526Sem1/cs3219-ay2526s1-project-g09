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
import com.peerprep.microservices.matching.dto.CollabSession;
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
  private final RedisChannels channels;
  private final MatchingTimeoutConfig timeoutConfig;
  private final CollabServiceClient collabServiceClient;

  /*
   * Map of userId to CompletableFuture for pending match acceptance requests.
   */
  private final Map<String, CompletableFuture<MatchAcceptanceOutcome>> matchedWaitingFutures = new ConcurrentHashMap<>();

  private final Map<String, CollabSession> collabSessionsByMatchId = new ConcurrentHashMap<>();

  /**
   * Connects a user to a match acceptance.
   *
   * @param userId the ID of the user to connect
   * @param matchId the ID of the match to connect to
   * @return the match acceptance outcome
   */
  public CompletableFuture<MatchAcceptanceOutcome> connectMatch(String userId, String matchId) {

    log.info("Connecting User {} to match {}..", userId, matchId);

    CompletableFuture<MatchAcceptanceOutcome> connectFuture = new CompletableFuture<>();

    MatchAcceptanceStatus updated = redisAcceptanceService.updateAcceptance(
      matchId,
      userId,
      AcceptanceStatus.CONNECTED,
      channels.MATCH_ACCEPTANCE_CHANNEL);

    if (updated == null) {
      throw new IllegalArgumentException("No such match: " + matchId);
    }

    MatchAcceptanceOutcome outcome = buildOutcome(updated);
    // Complete future if outcome already determined.

    if (outcome.getStatus() != MatchAcceptanceOutcome.Status.PENDING) {
      log.info("Match {} was rejected. Completing future.", matchId);
      connectFuture.complete(outcome);
    } else {
      // Add future if no outcome yet.
      matchedWaitingFutures.put(userId, connectFuture);
      connectFuture.whenComplete((res, err) -> matchedWaitingFutures.remove(userId));
      log.info("Connected User {} to match {}", userId, matchId);
    }

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
      channels.MATCH_ACCEPTANCE_CHANNEL);

    if (updated == null) {
      throw new IllegalArgumentException("No such match: " + matchId);
    }

    MatchAcceptanceOutcome outcome = buildOutcome(updated);
    log.info("Evaluated outcome for match {}: {}", matchId, outcome);

    if (outcome.getStatus() != MatchAcceptanceOutcome.Status.PENDING) {
      String userId1 = updated.getMatchDetails().getUser1Id();
      String userId2 = updated.getMatchDetails().getUser2Id();
      publishAcceptanceNotification(userId1, userId2, updated.getMatchDetails().getMatchId(), outcome);
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
      channels.MATCH_ACCEPTANCE_CHANNEL);

    if (updated == null) {
      throw new IllegalArgumentException("No such match: " + matchId);
    }

    MatchAcceptanceOutcome outcome = buildOutcome(updated);

    if (outcome.getStatus() != MatchAcceptanceOutcome.Status.PENDING) {
      String userId1 = updated.getMatchDetails().getUser1Id();
      String userId2 = updated.getMatchDetails().getUser2Id();
      publishAcceptanceNotification(userId1, userId2, updated.getMatchDetails().getMatchId(), outcome);
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
   * @param matchId the ID of the match
   * @param outcome the outcome of the match acceptance
   */
  private void publishAcceptanceNotification(String user1Id, String user2Id, String matchId,
    MatchAcceptanceOutcome outcome) {
    log.info("Publishing acceptance notification for match status {} to users {} and {}", outcome.getStatus(), user1Id,
      user2Id);
    AcceptanceNotification acceptanceNotification = new AcceptanceNotification(
      user1Id,
      user2Id,
      outcome.getStatus(),
      matchId,
      outcome.getSession());

    redisTemplate.convertAndSend(channels.MATCH_ACCEPTANCE_CHANNEL, acceptanceNotification);
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

    CompletableFuture<MatchAcceptanceOutcome> user1Future = matchedWaitingFutures.get(user1Id);
    CompletableFuture<MatchAcceptanceOutcome> user2Future = matchedWaitingFutures.get(user2Id);

    MatchAcceptanceOutcome.Status matchStatus = acceptanceNotification.getStatus();

    if (matchStatus == MatchAcceptanceOutcome.Status.PENDING) {
      log.info("Pending Acceptance Status does not complete request");
      return;
    }

    CollabSession session = acceptanceNotification.getSession();

    if (session != null && acceptanceNotification.getMatchId() != null) {
      collabSessionsByMatchId.put(acceptanceNotification.getMatchId(), session);
    }

    MatchAcceptanceOutcome outcome = new MatchAcceptanceOutcome(matchStatus, null, session);

    if (user1Future != null && !user1Future.isDone()) {
      user1Future.complete(outcome);
      matchedWaitingFutures.remove(user1Id);
    }

    if (user2Future != null && !user2Future.isDone()) {
      user2Future.complete(outcome);
      matchedWaitingFutures.remove(user2Id);
    }

    if (matchStatus != MatchAcceptanceOutcome.Status.PENDING
      && acceptanceNotification.getMatchId() != null) {
      collabSessionsByMatchId.remove(acceptanceNotification.getMatchId());
    }
  }

  private MatchAcceptanceOutcome buildOutcome(MatchAcceptanceStatus status) {
    MatchAcceptanceOutcome.Status finalStatus = evaluateMatchOutcome(status);

    CollabSession collabSession = null;
    if (finalStatus == MatchAcceptanceOutcome.Status.SUCCESS) {
      log.info("Both users accepted match {}. Creating collaboration session.", status.getMatchDetails().getMatchId());
      log.debug("Match details: {}", status.getMatchDetails());
      collabSession = collabSessionsByMatchId.computeIfAbsent(
        status.getMatchDetails().getMatchId(),
        key -> collabServiceClient.createSession(
          buildParticipantList(status),
          toPreferenceMap(status)));
    }
    log.info("Created collaboration session for match {}: {}", status.getMatchDetails().getMatchId(), collabSession);

    return new MatchAcceptanceOutcome(finalStatus, status.getMatchDetails(), collabSession);
  }

  private List<String> buildParticipantList(MatchAcceptanceStatus status) {
    List<String> participants = new ArrayList<>(2);
    participants.add(status.getMatchDetails().getUser1Id());
    participants.add(status.getMatchDetails().getUser2Id());
    return participants;
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

    if (mapped.isEmpty()) {
      throw new IllegalStateException(
        "No overlapping question preferences available for match "
          + status.getMatchDetails().getMatchId());
    }

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
