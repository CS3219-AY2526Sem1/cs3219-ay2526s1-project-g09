package com.peerprep.microservices.matching.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
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
import com.peerprep.microservices.matching.exception.InvalidUserPreferenceException;
import com.peerprep.microservices.matching.exception.NoPendingMatchRequestException;
import com.peerprep.microservices.matching.exception.UserPreferenceMappingException;
import com.peerprep.microservices.matching.exception.UserPreferenceNotFoundException;
import com.peerprep.microservices.matching.model.UserPreference;
import com.peerprep.microservices.matching.repository.MatchingRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserPreferenceService {

  private final MatchingRepository userPreferenceRepository;
  private final RedisTemplate<String, Object> redisTemplate;

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
   * <p>
   * The method copies all fields from the request object and constructs a new
   * {@link UserPreference} instance using the builder, ensuring immutability
   * of the sets.
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
   * <p>
   * This is useful for sending user preference data back in API responses.
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
