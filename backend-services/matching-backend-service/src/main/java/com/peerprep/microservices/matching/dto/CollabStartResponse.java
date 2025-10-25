package com.peerprep.microservices.matching.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Response payload from the collaboration service when creating a session.
 * 
 * @param success whether the session creation was successful
 * @param session the {@link CollabSession} object containing session details if
 *                successful
 * @param error   an optional error code or identifier if the request failed
 * @param message a descriptive message providing additional context or error
 *                details
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CollabStartResponse(
        boolean success,
        CollabSession session,
        String error,
        String message) {
}
