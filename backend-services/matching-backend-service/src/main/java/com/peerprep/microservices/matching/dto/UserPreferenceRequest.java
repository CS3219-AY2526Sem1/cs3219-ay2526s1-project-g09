package com.peerprep.microservices.matching.dto;

import java.util.Map;
import java.util.Set;

/**
 * Represents a user's preferences received as a request.
 * 
 * @param userId the unique identifier of the user
 * @param topics a mapping of question categories with a set of difficulties
 */
public record UserPreferenceRequest(
  String userId,
  Map<String, Set<String>> topics) {
}
