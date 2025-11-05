package com.peerprep.microservices.matching.client;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.peerprep.microservices.matching.dto.CollabStartRequest;
import com.peerprep.microservices.matching.dto.CollabStartResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * A client component responsible for communicating with the external Collaboration Service.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CollabServiceClient {

  private final RestTemplate restTemplate;

  @Value("${collab.service.base-url}")
  private String collabServiceBaseUrl;

  /**
   * Creates a new collaboration session for the specified users and their question preferences.
   * 
   * @param users a list of user identifiers participating in the collaboration session, must not be {@code null} or
   *          empty.
   * @param questionPreferences a map of user IDs to their corresponding question topics or categories, may be empty but
   *          not {@code null}.
   * @throws IllegalStateException if the Collaboration Service returns an error response.
   */
  public void createSession(List<String> users, Map<String, List<String>> questionPreferences) {
    log.info("Creating collaboration session for users: {}", users);
    String base = collabServiceBaseUrl.endsWith("/")
      ? collabServiceBaseUrl.substring(0, collabServiceBaseUrl.length() - 1)
      : collabServiceBaseUrl;
    String url = base + "/start";

    CollabStartRequest request = new CollabStartRequest(users, questionPreferences);
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);

    try {
      log.debug("Sending request to collaboration service: {}", url);
      ResponseEntity<CollabStartResponse> response = restTemplate.postForEntity(
        url,
        new HttpEntity<>(request, headers),
        CollabStartResponse.class);

      CollabStartResponse body = response.getBody();
      if (body == null) {
        throw new IllegalStateException("Collaboration service returned an empty response");
      }

      if (!body.success()) {
        String errorMessage = body.error() != null ? body.error() : "Unknown error";
        throw new IllegalStateException(
          String.format("Collaboration service failed to create session: %s", errorMessage));
      }

      log.info("Successfully created collaboration session for users {}", users);
    } catch (RestClientException ex) {
      log.error("Failed to create collaboration session", ex);
      throw new IllegalStateException("Unable to create collaboration session", ex);
    }
  }
}
