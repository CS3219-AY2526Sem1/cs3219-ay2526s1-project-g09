package com.peerprep.microservices.matching.dto;

import java.util.Map;
import java.util.Set;

/**
 * Represents a user's preferences received as a request.
 */
public record UserPreferenceRequest(
    String userId,
    Map<String, Set<String>> topics) {
}
