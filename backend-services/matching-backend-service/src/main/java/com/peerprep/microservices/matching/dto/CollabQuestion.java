package com.peerprep.microservices.matching.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * DTO representing question metadata returned from the collaboration service.
 * 
 * @param questionId the unique identifier of the question
 * @param title      the title of the question
 * @param body       the full body or description of the question
 * @param topics     the list of topic tags associated with the question
 * @param hints      the list of hints for solving the question
 * @param answer     the reference answer or solution for the question
 * @param timeLimit  the time limit (in seconds or minutes) for answering the
 *                   question
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
