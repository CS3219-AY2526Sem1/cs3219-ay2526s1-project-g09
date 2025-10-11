package com.peerprep.microservices.matching.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.peerprep.microservices.matching.deserializers.MatchResultDeserializer;
import com.peerprep.microservices.matching.model.UserPreference;
import lombok.Data;

import lombok.AllArgsConstructor;

/**
 * DTO representing a match result between two users in Redis Pub/Sub.
 */
@Data
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonDeserialize(using = MatchResultDeserializer.class)
public class MatchingNotification {
  private String user1RequestId;
  private String user2RequestId;
  private UserPreference user1Preference;
  private UserPreference user2Preference;
  private String matchId;
}
