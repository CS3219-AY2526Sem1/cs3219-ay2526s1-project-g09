package com.peerprep.microservices.matching.dto;

import java.util.Set;

/**
 * Represents a user's preferences received as a request.
 */
public record UserPreferenceRequest(String userId, Set<String> topics, Set<String> difficulties, int minTime,
    int maxTime) {

}
