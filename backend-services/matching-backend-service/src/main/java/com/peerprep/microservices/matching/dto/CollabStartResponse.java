package com.peerprep.microservices.matching.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Response payload from the collaboration service when creating a session.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CollabStartResponse(
  boolean success,
  CollabSession session,
  String error,
  String message) {
}
