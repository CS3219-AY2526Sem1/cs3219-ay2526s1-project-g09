package com.peerprep.microservices.matching.dto;

import java.util.Set;

/**
 * Represents a user's preferences returned as a response.
 */
public record UserPreferenceResponse(String userId, Set<String> topics, Set<String> difficulties, int minTime,
    int maxTime) {

}
