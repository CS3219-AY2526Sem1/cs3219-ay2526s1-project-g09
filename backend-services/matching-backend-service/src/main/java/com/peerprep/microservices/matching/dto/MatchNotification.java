package com.peerprep.microservices.matching.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.peerprep.microservices.matching.deserializers.MatchResultDeserializer;
import com.peerprep.microservices.matching.model.UserPreference;
import lombok.Data;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonDeserialize(using = MatchResultDeserializer.class)
public class MatchNotification {
  private String user1RequestId;
  private String user2RequestId;
  private UserPreference user1Preference;
  private UserPreference user2Preference;
}
