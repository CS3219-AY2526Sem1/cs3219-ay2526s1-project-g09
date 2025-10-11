package com.peerprep.microservices.matching.model;

import java.util.HashSet;
import java.util.Set;

import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import lombok.Builder;
import lombok.Getter;
import lombok.NonNull;

/**
 * Represents question preferences for matching.
 */
@Document(value = "questionPreference")
@Getter
@Builder
public class QuestionPreference {

  @NonNull
  @JsonDeserialize(as = HashSet.class)
  private final Set<String> topics;

  @NonNull
  @JsonDeserialize(as = HashSet.class)
  private final Set<String> difficulties;

  private final int minTime;
  private final int maxTime;

  /**
   * Custom build method
   */
  public static class QuestionPreferenceBuilder {
    public QuestionPreference build() {
      validate(topics, difficulties, minTime, maxTime);
      return new QuestionPreference(topics, difficulties, minTime, maxTime);
    }
  }

  /**
   * Constructor with validation
   * 
   * @param topics       the set of topics that a user prefers.
   * @param difficulties the set of difficulties that a user prefers.
   * @param minTime      the minimum time that a user is willing to use for a
   *                     question.
   * @param maxTime      the maximum time that a user is willing to use for a
   *                     question.
   * 
   */
  @JsonCreator
  public QuestionPreference(
      @JsonProperty("topics") Set<String> topics,
      @JsonProperty("difficulties") Set<String> difficulties,
      @JsonProperty("minTime") int minTime,
      @JsonProperty("maxTime") int maxTime) {
    validate(topics, difficulties, minTime, maxTime);
    this.topics = topics;
    this.difficulties = difficulties;
    this.minTime = minTime;
    this.maxTime = maxTime;
  }

  /**
   * Validation logic for constructor
   */
  private static void validate(Set<String> topics, Set<String> difficulties, int minTime, int maxTime) {

    if (topics == null || topics.isEmpty())
      throw new IllegalArgumentException("topics cannot be null or empty");
    if (difficulties == null || difficulties.isEmpty())
      throw new IllegalArgumentException("difficulties cannot be null or empty");
    if (minTime <= 0)
      throw new IllegalArgumentException("minTime must be > 0");
    if (maxTime <= 0)
      throw new IllegalArgumentException("maxTime must be > 0");
    if (maxTime < minTime)
      throw new IllegalArgumentException("maxTime must be >= minTime");
  }

  /**
   * Returns a new QuestionPreference containing only the overlapping topics and
   * difficulties between this user and another user.
   */
  public QuestionPreference getOverlap(QuestionPreference other) {
    Set<String> overlappingTopics = new HashSet<>(this.topics);
    overlappingTopics.retainAll(other.topics);

    Set<String> overlappingDifficulties = new HashSet<>(this.difficulties);
    overlappingDifficulties.retainAll(other.difficulties);

    // Calculate overlapping time range
    int overlapMinTime = Math.max(this.minTime, other.minTime);
    int overlapMaxTime = Math.min(this.maxTime, other.maxTime);

    if (overlapMinTime > overlapMaxTime) {
      overlapMinTime = overlapMaxTime;
    }

    return QuestionPreference.builder()
        .topics(overlappingTopics)
        .difficulties(overlappingDifficulties)
        .minTime(overlapMinTime)
        .maxTime(overlapMaxTime)
        .build();
  }
}
