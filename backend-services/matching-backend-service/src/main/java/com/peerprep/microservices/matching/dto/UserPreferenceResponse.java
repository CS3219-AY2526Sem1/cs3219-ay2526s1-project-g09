package com.peerprep.microservices.matching.dto;

import java.util.Map;
import java.util.Set;

/**
 * Represents a user's preferences returned as a response.
 * 
 * @param userId the unique identifier of the user
 * @param topics a mapping of question categories with a set of difficulties
 */
public record UserPreferenceResponse(String userId,
        Map<String, Set<String>> topics) {

}
