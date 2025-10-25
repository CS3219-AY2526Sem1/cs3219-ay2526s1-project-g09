package com.peerprep.microservices.matching.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * DTO representing question metadata returned from the collaboration service.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record CollabQuestion(
  String questionId,
  String title,
  String body,
  List<String> topics,
  List<String> hints,
  String answer,
  Integer timeLimit) {
}
