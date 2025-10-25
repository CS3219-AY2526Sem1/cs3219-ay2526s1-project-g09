package com.peerprep.microservices.matching.dto;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Request payload for creating a collaboration session.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record CollabStartRequest(
  List<String> users,
  Map<String, List<String>> questionPreferences) {
}
