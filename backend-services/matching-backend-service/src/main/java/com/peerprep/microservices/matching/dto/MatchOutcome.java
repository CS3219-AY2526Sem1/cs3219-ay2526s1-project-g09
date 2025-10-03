package com.peerprep.microservices.matching.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing the outcome of a matching request.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchOutcome {
  public enum Status {
    MATCHED,
    TIMEOUT,
    CANCELLED
  }

  private Status status;
  private UserPreferenceResponse match;
}
