package com.peerprep.microservices.matching.service;

import java.util.Set;

import org.springframework.stereotype.Service;

import com.peerprep.microservices.matching.dto.UserPreferenceRequest;
import com.peerprep.microservices.matching.dto.UserPreferenceResponse;
import com.peerprep.microservices.matching.exception.UserPreferenceNotFoundException;
import com.peerprep.microservices.matching.model.UserPreference;
import com.peerprep.microservices.matching.repository.MatchingRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for managing user preferences, including creation, retrieval,
 * updating, and deletion of preferences.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserPreferenceService {

  private final MatchingRepository userPreferenceRepository;

  // ---------- [User Preference] ----------

  /**
   * Update an existing user preference, or create a new one if it does not exist.
   *
   * @param request The {@link UserPreferenceRequest} containing preference data.
   * @return {@link UserPreferenceResponse} representing the saved or updated
   *         preference.
   */
  public UserPreferenceResponse upsertUserPreference(UserPreferenceRequest request) {

    UserPreference userPreference = mapToUserPreference(request);

    userPreferenceRepository.save(userPreference);
    log.info("User preference updated for userId: {}", userPreference.getUserId());

    return mapToResponse(userPreference);
  }

  /**
   * Delete a user's preference and remove them from the matching pool.
   *
   * @param userId The ID of the user to delete.
   * @throws UserPreferenceNotFoundException if no preference exists for the user.
   */
  public void deleteUserPreference(String userId) {
    if (!userPreferenceRepository.existsById(userId)) {
      throw new UserPreferenceNotFoundException(userId);
    }

    // Delete from repository
    userPreferenceRepository.deleteById(userId);
    log.info("User preference deleted for userId: {}", userId);
  }

  /**
   * Retrieve a user's preference by their userId.
   *
   * @param userId The ID of the user.
   * @return {@link UserPreferenceResponse} for the user.
   * @throws UserPreferenceNotFoundException if no preference exists for the user.
   */
  public UserPreferenceResponse getUserPreference(String userId) {
    return userPreferenceRepository.findById(userId)
        .map(this::mapToResponse)
        .orElseThrow(() -> new UserPreferenceNotFoundException(userId));
  }

  // ---------- [Utility] ----------

  /**
   * Converts a {@link UserPreferenceRequest} DTO into a {@link UserPreference}
   * model.
   *
   * @param userPref the {@link UserPreferenceRequest} containing user preference
   *                 data
   * @return a {@link UserPreference} instance with the same data as the request
   */
  public UserPreference mapToUserPreference(UserPreferenceRequest userPref) {

    return UserPreference.builder()
        .userId(userPref.userId())
        .topics(Set.copyOf(userPref.topics()))
        .difficulties(Set.copyOf(userPref.difficulties()))
        .minTime(userPref.minTime())
        .maxTime(userPref.maxTime())
        .build();
  }

  /**
   * Converts a {@link UserPreference} model into a {@link UserPreferenceResponse}
   * DTO.
   *
   * @param userPreference the {@link UserPreference} to convert
   * @return a {@link UserPreferenceResponse} instance containing the same data
   */
  public UserPreferenceResponse mapToResponse(UserPreference userPreference) {
    return new UserPreferenceResponse(
        userPreference.getUserId(),
        userPreference.getTopics(),
        userPreference.getDifficulties(),
        userPreference.getMinTime(),
        userPreference.getMaxTime());
  }

}
