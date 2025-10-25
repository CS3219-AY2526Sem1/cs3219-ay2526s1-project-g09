package com.peerprep.microservices.matching.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * DTO representing a collaboration session created for a match.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CollabSession(
  String sessionId,
  String questionId,
  List<String> users,
  CollabQuestion question) {
}
