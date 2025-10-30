package com.peerprep.microservices.matching.dto;

/**
 * DTO representing the response to a match acceptance request.
 * 
 * @param status the status of the match acceptance (e.g., SUCCESS, REJECTED, PENDING)
 */
public record MatchAcceptanceResponse(
  MatchAcceptanceOutcome.Status status) {

}
