package com.peerprep.microservices.matching.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * DTO representing a collaboration session created for a match.
 * 
 * @param sessionId  the unique identifier of the collaboration session
 * @param questionId the ID of the question assigned to this session
 * @param users      the list of user IDs participating in the session
 * @param question   the detailed {@link CollabQuestion} associated with this
 *                   session
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CollabSession(
        String sessionId,
        String questionId,
        List<String> users,
        CollabQuestion question) {
}
