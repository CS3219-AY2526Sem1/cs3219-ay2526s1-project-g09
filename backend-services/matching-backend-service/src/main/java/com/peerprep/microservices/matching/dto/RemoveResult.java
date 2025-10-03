package com.peerprep.microservices.matching.dto;

/**
 * DTO representing the result of a remove operation for a user's request.
 */
public record RemoveResult(boolean removed, String userId, String requestId) {
}
