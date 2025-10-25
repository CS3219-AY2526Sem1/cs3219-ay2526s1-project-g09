package com.peerprep.microservices.matching.dto;

/**
 * DTO representing the response to a match acceptance request.
 */
public record MatchAcceptanceResponse(
  MatchAcceptanceOutcome.Status status,
  CollabSession session) {

}
