package com.peerprep.microservices.matching.dto;

/**
 * DTO representing a request to accept the match.
 * 
 * @param matchId the unique identifier of the match to be accepted
 */
public record MatchAcceptanceRequest(String matchId) {

}
