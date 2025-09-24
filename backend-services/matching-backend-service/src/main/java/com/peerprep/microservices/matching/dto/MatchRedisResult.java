package com.peerprep.microservices.matching.dto;

import com.peerprep.microservices.matching.model.UserPreference;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MatchResultInfo {
  private final boolean oldRequestDeleted;
  private final String oldRequestId;
  private final UserPreference matched;
  private final String matchedRequestId;
}
