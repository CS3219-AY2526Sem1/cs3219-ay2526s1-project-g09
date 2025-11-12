package com.peerprep.microservices.matching.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * DTO representing the users individual acceptance of a match.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class MatchAcceptanceStatus {
  public enum AcceptanceStatus {
    PENDING,
    EXPIRED,
    CONNECTED,
    ACCEPTED,
    REJECTED
  }

  private MatchDetails matchDetails;
  private AcceptanceStatus user1Accepted = AcceptanceStatus.PENDING;
  private AcceptanceStatus user2Accepted = AcceptanceStatus.PENDING;
}
