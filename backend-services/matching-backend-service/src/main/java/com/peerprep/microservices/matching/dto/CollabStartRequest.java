package com.peerprep.microservices.matching.dto;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Request payload for creating a collaboration session.
 * 
 * @param users the list of user IDs to include in the collaboration session
 * @param questionPreferences a mapping of question categories with a list of difficulties for session creation
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record CollabStartRequest(
  List<String> users,
  Map<String, List<String>> questionPreferences) {
}
