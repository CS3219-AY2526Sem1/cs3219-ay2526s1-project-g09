package com.peerprep.microservices.matching.dto;

/**
 * DTO representing the result of a remove operation for a user's request.
 * 
 * @param removed   whether the removal was successful
 * @param userId    the ID of the user whose request was removed
 * @param requestId the ID of the match request that was removed
 */
public record RemoveMatchingResult(boolean removed, String userId, String requestId) {
}
