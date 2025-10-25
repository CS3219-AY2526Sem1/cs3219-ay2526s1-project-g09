package com.peerprep.microservices.matching.model;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
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
  @JsonDeserialize(as = HashMap.class)
  private final Map<String, Set<String>> topics; // topic -> selected difficulties

  /**
   * Custom build method
   */
  public static class QuestionPreferenceBuilder {
    public QuestionPreference build() {
      validate(topics);
      return new QuestionPreference(topics);
    }
  }

  /**
   * Constructor with validation
   * 
   * @param topics the map of topics to selected difficulties.
   */
  @JsonCreator
  public QuestionPreference(
    @JsonProperty("topics") Map<String, Set<String>> topics) {
    validate(topics);
    this.topics = topics;
  }

  /**
   * Validation logic for constructor
   */
  private static void validate(Map<String, Set<String>> topics) {
    if (topics == null || topics.isEmpty()) {
      throw new IllegalArgumentException("topics cannot be null or empty");
    }

    for (Map.Entry<String, Set<String>> entry : topics.entrySet()) {
      if (entry.getValue() == null || entry.getValue().isEmpty()) {
        throw new IllegalArgumentException(
          "Each topic must have at least one selected difficulty: " + entry.getKey());
      }
    }
  }

  /**
   * Returns a new QuestionPreference containing only the overlapping topics and difficulties between this user and
   * another user.
   */
  public QuestionPreference getOverlap(QuestionPreference other) {
    Map<String, Set<String>> overlappingTopics = new HashMap<>();

    for (Map.Entry<String, Set<String>> entry : this.topics.entrySet()) {
      String topic = entry.getKey();
      Set<String> otherDiffs = other.topics.get(topic);

      if (otherDiffs != null) {
        Set<String> commonDiffs = new HashSet<>(entry.getValue());
        commonDiffs.retainAll(otherDiffs);

        if (!commonDiffs.isEmpty()) {
          overlappingTopics.put(topic, commonDiffs);
        }
      }
    }

    return QuestionPreference.builder()
      .topics(overlappingTopics)
      .build();
  }
}
