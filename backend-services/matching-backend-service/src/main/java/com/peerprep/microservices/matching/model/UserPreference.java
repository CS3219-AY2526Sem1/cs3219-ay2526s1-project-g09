package com.peerprep.microservices.matching.model;

import java.util.Set;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NonNull;

@Document(value = "userPreference")
@Getter
@Builder
public class UserPreference {

  @Id
  @NonNull
  private final String userId;

  @NonNull
  private final Set<String> topics;

  @NonNull
  private final Set<String> difficulties;

  private final int minTime;
  private final int maxTime;

  public static class UserPreferenceBuilder {
    public UserPreference build() {
      validate(userId, topics, difficulties, minTime, maxTime);
      return new UserPreference(userId, topics, difficulties, minTime, maxTime);
    }
  }

  @JsonCreator
  public UserPreference(
      @JsonProperty("userId") String userId,
      @JsonProperty("topics") Set<String> topics,
      @JsonProperty("difficulties") Set<String> difficulties,
      @JsonProperty("minTime") int minTime,
      @JsonProperty("maxTime") int maxTime) {
    validate(userId, topics, difficulties, minTime, maxTime);
    this.userId = userId;
    this.topics = topics;
    this.difficulties = difficulties;
    this.minTime = minTime;
    this.maxTime = maxTime;
  }

  /**
   * Validation logic for constructor
   */
  private static void validate(String userId, Set<String> topics, Set<String> difficulties, int minTime, int maxTime) {
    if (userId == null || userId.isEmpty())
      throw new IllegalArgumentException("userId cannot be null or empty");
    if (topics == null || topics.isEmpty())
      throw new IllegalArgumentException("topics cannot be null or empty");
    if (difficulties == null || difficulties.isEmpty())
      throw new IllegalArgumentException("difficulties cannot be null or empty");
    if (minTime <= 0)
      throw new IllegalArgumentException("minTime must be > 0");
    if (maxTime <= 0)
      throw new IllegalArgumentException("maxTime must be > 0");
  }
}
