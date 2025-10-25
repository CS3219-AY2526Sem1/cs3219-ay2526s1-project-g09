package com.peerprep.microservices.matching.dto;

import java.util.Map;
import java.util.Set;

/**
 * Represents a user's preferences returned as a response.
 */
public record UserPreferenceResponse(String userId,
  Map<String, Set<String>> topics) {

}
