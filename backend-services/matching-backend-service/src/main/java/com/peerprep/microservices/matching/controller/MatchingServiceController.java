package com.peerprep.microservices.matching.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.peerprep.microservices.matching.dto.MatchAcceptanceRequest;
import com.peerprep.microservices.matching.dto.MatchAcceptanceResponse;
import com.peerprep.microservices.matching.config.MatchingTimeoutConfig;
import com.peerprep.microservices.matching.dto.MatchAcceptanceOutcome;
import com.peerprep.microservices.matching.dto.MatchAcceptanceStatus;
import com.peerprep.microservices.matching.dto.TimeoutConfig;
import com.peerprep.microservices.matching.dto.UserPreferenceRequest;
import com.peerprep.microservices.matching.dto.UserPreferenceResponse;
import com.peerprep.microservices.matching.exception.UserPreferenceNotFoundException;
import com.peerprep.microservices.matching.service.AcceptanceService;
import com.peerprep.microservices.matching.service.HealthService;
import com.peerprep.microservices.matching.service.MatchingService;
import com.peerprep.microservices.matching.service.UserPreferenceService;

import lombok.RequiredArgsConstructor;

/**
 * REST controller for handling matching service operations.
 */
@RestController
@RequestMapping("/api/v1/matching-service")
@RequiredArgsConstructor
@CrossOrigin(origins = { "http://localhost:5173", "http://peerprep-ui-shell.s3-website-ap-southeast-1.amazonaws.com" })
public class MatchingServiceController {

  private final MatchingService matchingService;
  private final UserPreferenceService userPreferenceService;
  private final AcceptanceService matchingAcceptanceService;
  private final HealthService healthService;
  private final MatchingTimeoutConfig timeoutConfig;

  @GetMapping("/health")
  public ResponseEntity<Map<String, Object>> health() {
    return healthService.getLiveness();
  }

  @GetMapping("/health/ready")
  public ResponseEntity<Map<String, Object>> readiness() {
    return healthService.getReadiness();
  }

  @GetMapping("config")
  @ResponseStatus(HttpStatus.OK)
  public TimeoutConfig updateUserPreference() {
    TimeoutConfig timeoutConfigResponse = new TimeoutConfig(
        timeoutConfig.getMatchRequest(),
        timeoutConfig.getMatchAcceptance());
    return timeoutConfigResponse;
  }

  // ---------- [User Preference] ----------
  /**
   * Updates or creates the user preference for the given user ID.
   *
   * @param userId                the ID of the user whose preference is being
   *                              updated
   * @param userPreferenceRequest the request payload containing the new or
   *                              updated preference data
   * @return the updated or newly created {@link UserPreferenceResponse}
   */
  @PutMapping("preferences/{userId}")
  @ResponseStatus(HttpStatus.OK)
  public UserPreferenceResponse updateUserPreference(
      @PathVariable String userId,
      @RequestBody UserPreferenceRequest userPreferenceRequest) {
    return userPreferenceService.upsertUserPreference(userPreferenceRequest);
  }

  /**
   * Deletes the user preference for the given user ID.
   *
   * @param userId the ID of the user whose preference is to be deleted
   */
  @DeleteMapping("preferences/{userId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteUserPreference(@PathVariable String userId) {
    userPreferenceService.deleteUserPreference(userId);
  }

  /**
   * Retrieves the user preference for the given user ID.
   *
   * @param userId the ID of the user whose preference is being requested
   * @return the {@link UserPreferenceResponse} containing the user's preference
   * @throws UserPreferenceNotFoundException if the user preference does not exist
   */
  @GetMapping("preferences/{userId}")
  @ResponseStatus(HttpStatus.OK)
  public UserPreferenceResponse getUserPreference(@PathVariable String userId) {
    return userPreferenceService.getUserPreference(userId);
  }

  // ---------- [Matching] ----------
  /**
   * Attempts to find a match for a user asynchronously.
   * 
   * If a compatible match exists in the matching pool, the future completes
   * immediately with a {@link ResponseEntity} containing the matched user.
   * Otherwise, the user is added to the pool and waits asynchronously until
   * a match is found or the timeout expires.
   * 
   * If no match is found within the timeout, the future completes with a
   * {@link ResponseEntity} with HTTP status 202 (Accepted) indicating that the
   * match request was valid.
   *
   * @param userPreferenceRequest the {@link UserPreferenceRequest} containing the
   *                              user's matching preferences
   * @return a {@link CompletableFuture} that will complete with a
   *         {@link ResponseEntity} containing
   *         the matched user if found, or a 202 Accepted response if no match is
   *         found within the timeout
   */
  @PutMapping("/match-requests")
  public CompletableFuture<ResponseEntity<?>> requestMatch(@RequestBody UserPreferenceRequest userPreferenceRequest) {

    long timeoutMs = timeoutConfig.getMatchRequest();

    // Request a match asynchronously
    return matchingService.requestMatchAsync(userPreferenceRequest, timeoutMs)
        .thenApply(outcome -> {
          switch (outcome.getStatus()) {
            case MATCHED:
              return ResponseEntity.ok(outcome);
            case TIMEOUT:
              return ResponseEntity.status(HttpStatus.ACCEPTED).body("No match found (timeout)");
            case CANCELLED:
              return ResponseEntity.status(HttpStatus.GONE).body("Match request was cancelled");
            default:
              return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Unknown status");
          }
        });
  }

  /**
   * Cancels a pending match request for the specified user.
   * 
   * If the user has a pending match request in the matching pool, it will be
   * removed and any associated {@link CompletableFuture} will be completed
   * with {@code null} to indicate cancellation.
   *
   * @param userId the ID of the user whose pending match request should be
   *               cancelled
   */
  @DeleteMapping("/match-requests/{userId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void cancelMatch(@PathVariable String userId) {
    matchingService.cancelMatchRequest(userId);
  }

  // ---------- [Matching Acceptance] ----------
  /**
   * Connects a specified user to a match request.
   * 
   * @param userId                 the ID of the user connecting to the match
   *                               request
   * @param matchAcceptanceRequest the request body containing the match ID
   * @return
   */
  @PostMapping("/match-requests/{userId}/connect")
  public CompletableFuture<ResponseEntity<MatchAcceptanceResponse>> connectMatch(
      @PathVariable String userId,
      @RequestBody MatchAcceptanceRequest matchAcceptanceRequest) {

    return matchingAcceptanceService
        .connectMatch(userId, matchAcceptanceRequest.matchId())
        .thenApply(response -> {
          MatchAcceptanceResponse body = new MatchAcceptanceResponse(
              response.getStatus(),
              response.getSession());

          if (response.getStatus() == MatchAcceptanceOutcome.Status.SUCCESS) {
            return ResponseEntity.ok(body);
          } else if (response.getStatus() == MatchAcceptanceOutcome.Status.REJECTED) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
          } else {
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(body);
          }
        });
  }

  /**
   * Accepts a match request for the specified user.
   * 
   * @param userId                 the ID of the user accepting the match request
   * @param matchAcceptanceRequest the request body containing the match ID
   * @return
   */
  @PutMapping("/match-requests/{userId}/accept")
  public MatchAcceptanceStatus acceptMatch(
      @PathVariable String userId,
      @RequestBody MatchAcceptanceRequest matchAcceptanceRequest) {

    return matchingAcceptanceService.acceptMatch(userId, matchAcceptanceRequest.matchId());
  }

  /**
   * Rejects a match request for the specified user.
   * 
   * @param userId                 the ID of the user rejecting the match request
   * @param matchAcceptanceRequest the request body containing the match ID
   */
  @PutMapping("/match-requests/{userId}/reject")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public MatchAcceptanceStatus rejectMatch(@PathVariable String userId,
      @RequestBody MatchAcceptanceRequest matchAcceptanceRequest) {

    return matchingAcceptanceService.rejectMatch(userId, matchAcceptanceRequest.matchId());
  }

}
