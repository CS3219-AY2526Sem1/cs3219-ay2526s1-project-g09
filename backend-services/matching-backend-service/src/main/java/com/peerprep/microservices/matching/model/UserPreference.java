package com.peerprep.microservices.matching.model;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Builder;
import lombok.Getter;
import lombok.NonNull;

/**
 * Represents user preferences for matching.
 */
@Document(value = "userPreference")
@Getter
@Builder
public class UserPreference {

  @Id
  @NonNull
  private final String userId;

  @NonNull
  private final QuestionPreference questionPreference;

  /**
   * Custom build method
   */
  public static class UserPreferenceBuilder {
    public UserPreference build() {
      validate(userId, questionPreference);
      return new UserPreference(userId, questionPreference);
    }
  }

  /**
   * Constructor with validation
   * 
   * @param userId the user that the preference belongs to
   * @param questionPreference the user's preference for questions
   */
  @JsonCreator
  public UserPreference(
    @JsonProperty("userId") String userId,
    @JsonProperty("questionPreference") QuestionPreference questionPreference) {
    validate(userId, questionPreference);
    this.userId = userId;
    this.questionPreference = questionPreference;
  }

  /**
   * Create UserPreference from a flat map that contains userId and topics map.
   * 
   * @param flatMap a {@link Map} containing "userId" and "topics" entries, each topic also contains the corresponding
   *          difficulties selected
   * @return a {@link UserPreference} constructed from the provided map
   */
  @SuppressWarnings("unchecked")
  public static UserPreference fromFlatMap(Map<String, Object> flatMap) {
    String userId = (String) flatMap.get("userId");
    Map<String, Object> rawTopics = (Map<String, Object>) flatMap.get("topics");
    Map<String, java.util.Set<String>> topics = new HashMap<>();

    rawTopics.forEach((topic, diffsObj) -> {
      if (diffsObj instanceof java.util.List<?>list) {
        topics.put(topic, Set.copyOf((java.util.List<String>) list));
      }
    });

    QuestionPreference qp = QuestionPreference.builder()
      .topics(topics)
      .build();

    return UserPreference.builder()
      .userId(userId)
      .questionPreference(qp)
      .build();
  }

  /**
   * Validation logic for constructor
   * 
   * @param userId the unique identifier of the user; must not be null or empty
   * @param questionPreference the {@link QuestionPreference} object; must not be null
   * @throws IllegalArgumentException if userId is null/empty or questionPreference is null
   */
  private static void validate(String userId, QuestionPreference questionPreference) {
    if (userId == null || userId.isEmpty()) {
      throw new IllegalArgumentException("userId cannot be null or empty");
    }

    if (questionPreference == null) {
      throw new IllegalArgumentException("questionPreference cannot be null");
    }

  }

  /**
   * Returns a new UserPreference containing overlapping question preferences with another user.
   * 
   * @param other the {@link UserPreference} of another user to compare against
   * @return a new {@link UserPreference} containing the intersection of question preferences between this user and the
   *         other user
   */
  public UserPreference getOverlap(UserPreference other) {
    QuestionPreference overlap = this.questionPreference.getOverlap(other.questionPreference);
    return UserPreference.builder()
      .userId(other.userId)
      .questionPreference(overlap)
      .build();
  }

  /**
   * Flatten UserPreference into a Map suitable for Redis or JSON storage.
   * 
   * @return a {@link Map} containing the "userId" and "topics" entries
   */
  public Map<String, Object> toRedisMap() {
    Map<String, Object> map = new HashMap<>();
    map.put("userId", this.userId);
    map.put("topics", this.questionPreference.getTopics());
    return map;
  }

  /**
   * Constructs a UserPreference from a nested map representation (e.g., from Redis JSON).
   * 
   * @param nestedMap the {@link Map} containing the nested user preference data
   * @return a {@link UserPreference} built from the provided map
   * @throws IllegalArgumentException if the nestedMap is null, or if required fields like userId or topics are missing
   *           or empty
   */
  @SuppressWarnings("unchecked")
  public static UserPreference fromNestedMap(Map<String, Object> nestedMap) {
    if (nestedMap == null) {
      throw new IllegalArgumentException("nestedMap cannot be null");
    }

    String userId = (String) nestedMap.get("userId");
    if (userId == null || userId.isEmpty()) {
      throw new IllegalArgumentException("userId cannot be null or empty");
    }

    Map<String, Object> topicsMapRaw = (Map<String, Object>) nestedMap.get("topics");
    if (topicsMapRaw == null) {
      throw new IllegalArgumentException("topics cannot be null");
    }

    // Convert topics map with List<String> values
    Map<String, Set<String>> topicsMap = new HashMap<>();
    for (Map.Entry<String, Object> entry : topicsMapRaw.entrySet()) {
      String topic = entry.getKey();
      Set<String> difficulties = Set.copyOf((java.util.List<String>) entry.getValue());
      topicsMap.put(topic, difficulties);
    }

    QuestionPreference qp = QuestionPreference.builder()
      .topics(topicsMap)
      .build();

    return UserPreference.builder()
      .userId(userId)
      .questionPreference(qp)
      .build();
  }
}
