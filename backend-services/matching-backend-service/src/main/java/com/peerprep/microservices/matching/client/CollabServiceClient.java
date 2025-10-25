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

import com.peerprep.microservices.matching.dto.CollabSession;
import com.peerprep.microservices.matching.dto.CollabStartRequest;
import com.peerprep.microservices.matching.dto.CollabStartResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class CollabServiceClient {

  private final RestTemplate restTemplate;

  @Value("${collab.service.base-url}")
  private String collabServiceBaseUrl;

  public CollabSession createSession(List<String> users, Map<String, List<String>> questionPreferences) {
    log.info("Creating collaboration session for users: {}", users);
    String base = collabServiceBaseUrl.endsWith("/")
      ? collabServiceBaseUrl.substring(0, collabServiceBaseUrl.length() - 1)
      : collabServiceBaseUrl;
    String url = base + "/start";

    CollabStartRequest request = new CollabStartRequest(users, questionPreferences);
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);

    try {
      log.info("Sending request to collaboration service: {}", url);
      log.info("Request payload: {}", request);
      log.info("Request headers: {}", headers);
      ResponseEntity<CollabStartResponse> response = restTemplate.postForEntity(
        url,
        new HttpEntity<>(request, headers),
        CollabStartResponse.class);

      CollabStartResponse body = response.getBody();

      if (body == null) {
        throw new IllegalStateException("Collaboration service returned an empty response");
      }

      if (!body.success()) {
        String errorMessage = body.error() != null ? body.error() : body.message();
        throw new IllegalStateException(
          String.format("Collaboration service failed to create session: %s", errorMessage));
      }

      if (body.session() == null) {
        throw new IllegalStateException("Collaboration service response missing session data");
      }
      log.info("Successfully created collaboration session: {}", body.session());

      return body.session();
    } catch (RestClientException ex) {
      log.error("Failed to create collaboration session", ex);
      throw new IllegalStateException("Unable to create collaboration session", ex);
    }
  }
}
