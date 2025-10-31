package com.peerprep.microservices.matching.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Lightweight response payload indicating whether the collab session was created successfully.
 * 
 * @param success indicates if the collaboration session was created successfully
 * @param error contains error message if session creation failed
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CollabStartResponse(boolean success, String error) {
}
