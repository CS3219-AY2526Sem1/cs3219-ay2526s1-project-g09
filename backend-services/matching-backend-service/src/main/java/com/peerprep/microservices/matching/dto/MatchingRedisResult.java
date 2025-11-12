package com.peerprep.microservices.matching.dto;

import com.peerprep.microservices.matching.model.UserPreference;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * DTO representing the result of a Redis-based match operation.
 */
@Data
@AllArgsConstructor
public class MatchingRedisResult {
  private final boolean oldRequestDeleted;
  private final String oldRequestId;
  private final UserPreference matched;
  private final String matchedRequestId;
}
