package com.peerprep.microservices.matching.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class HealthService {

  private final RestTemplate restTemplate;

  @Value("${collab.service.base-url}")
  private String collabServiceBaseUrl;

  /**
   * Simple liveness check — confirms that the service itself is running.
   * 
   * @return a {@link ResponseEntity} containing a {@link Map} with information of
   *         status, service, timestamp and uptime
   */
  public ResponseEntity<Map<String, Object>> getLiveness() {
    Map<String, Object> health = new HashMap<>();
    health.put("status", "UP");
    health.put("service", "matching-service");
    health.put("timestamp", System.currentTimeMillis());
    health.put("uptimeSeconds", System.nanoTime() / 1_000_000_000.0);
    return ResponseEntity.ok(health);
  }

  /**
   * Readiness check. Verifies that dependent services (e.g. Collaboration
   * Service) are reachable and responding.
   * 
   * @return a {@link ResponseEntity} containing a {@link Map} with the current
   *         service, collab service message, status of collab and
   *         {@link HttpStatus#OK} if the dependent services
   *         are healthy, or {@link HttpStatus#SERVICE_UNAVAILABLE} if any
   *         critical dependency is down.
   */
  public ResponseEntity<Map<String, Object>> getReadiness() {
    Map<String, Object> result = new HashMap<>();
    result.put("service", "matching-service");

    boolean collabUp = false;
    String collabMessage;

    try {
      String base = collabServiceBaseUrl.endsWith("/")
          ? collabServiceBaseUrl.substring(0, collabServiceBaseUrl.length() - 1)
          : collabServiceBaseUrl;

      String collabHealthUrl = base + "/health";
      ResponseEntity<Map> collabResponse = restTemplate.getForEntity(collabHealthUrl, Map.class);

      if (collabResponse.getStatusCode().is2xxSuccessful()) {
        collabUp = true;
        collabMessage = "UP";
      } else {
        collabMessage = "UNHEALTHY (non-200)";
      }
    } catch (Exception e) {
      log.warn("Collab service health check failed: {}", e.getMessage());
      collabMessage = "DOWN (" + e.getClass().getSimpleName() + ")";
    }

    result.put("collabService", collabMessage);
    result.put("status", collabUp ? "UP" : "DEGRADED");

    HttpStatus httpStatus = collabUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    return new ResponseEntity<>(result, httpStatus);
  }
}
