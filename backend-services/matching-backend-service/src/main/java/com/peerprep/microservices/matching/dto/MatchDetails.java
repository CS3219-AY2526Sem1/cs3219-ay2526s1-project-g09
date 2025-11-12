package com.peerprep.microservices.matching.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.peerprep.microservices.matching.model.QuestionPreference;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * DTO representing a match result between two users.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class MatchDetails {
  private String matchId;
  private String user1Id;
  private String user2Id;
  private QuestionPreference questionPreference;

}
