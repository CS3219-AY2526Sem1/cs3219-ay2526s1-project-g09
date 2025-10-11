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
   * @param userId             the user that the preference belongs to
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
   * Create UserPreference from a flat map that contains userId, topics,
   * difficulties, minTime, maxTime
   */
  public static UserPreference fromFlatMap(Map<String, Object> flatMap) {
    String userId = (String) flatMap.get("userId");
    @SuppressWarnings("unchecked")
    Set<String> topics = Set.copyOf((java.util.List<String>) flatMap.get("topics"));
    @SuppressWarnings("unchecked")
    Set<String> difficulties = Set.copyOf((java.util.List<String>) flatMap.get("difficulties"));
    int minTime = (Integer) flatMap.get("minTime");
    int maxTime = (Integer) flatMap.get("maxTime");

    QuestionPreference qp = QuestionPreference.builder()
        .topics(topics)
        .difficulties(difficulties)
        .minTime(minTime)
        .maxTime(maxTime)
        .build();

    return UserPreference.builder()
        .userId(userId)
        .questionPreference(qp)
        .build();
  }

  /**
   * Validation logic for constructor
   */
  private static void validate(String userId, QuestionPreference questionPreference) {
    if (userId == null || userId.isEmpty())
      throw new IllegalArgumentException("userId cannot be null or empty");
    if (questionPreference == null)
      throw new IllegalArgumentException("questionPreference cannot be null");
  }

  /**
   * Returns a new UserPreference containing another user and the overlapping
   * question preferences
   * between this user and another user.
   */
  public UserPreference getOverlap(UserPreference other) {
    QuestionPreference overlap = this.questionPreference.getOverlap(other.questionPreference);
    return UserPreference.builder()
        .userId(other.userId)
        .questionPreference(overlap)
        .build();
  }

  /**
   * Flatten UserPreference into a Map suitable for Redis Lua script.
   * Includes userId, topics, difficulties, minTime, maxTime.
   */
  public Map<String, Object> toRedisMap() {
    Map<String, Object> map = new HashMap<>();
    map.put("userId", this.userId);
    map.put("topics", this.questionPreference.getTopics());
    map.put("difficulties", this.questionPreference.getDifficulties());
    map.put("minTime", this.questionPreference.getMinTime());
    map.put("maxTime", this.questionPreference.getMaxTime());
    return map;
  }
}
