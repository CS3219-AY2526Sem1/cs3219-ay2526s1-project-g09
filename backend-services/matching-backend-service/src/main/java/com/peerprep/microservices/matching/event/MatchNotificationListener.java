package com.peerprep.microservices.matching.event;

import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.peerprep.microservices.matching.dto.MatchNotification;
import com.peerprep.microservices.matching.exception.NotificationDeserializationException;
import com.peerprep.microservices.matching.exception.NotificationMappingException;
import com.peerprep.microservices.matching.exception.UserPreferenceDeserializationException;
import com.peerprep.microservices.matching.exception.UserPreferenceMappingException;
import com.peerprep.microservices.matching.service.MatchingService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Redis message listener for Redis Pub/Sub channels to handle matching-related
 * notifications.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MatchNotificationListener implements MessageListener {

  private final MatchingService matchingService;
  private final ObjectMapper objectMapper;

  /**
   * Called when a message is received from Redis.
   * 
   * @param message  the Redis message must not be {@literal null}.
   * @param _pattern pattern matching the channel (if specified) - can be
   *                 {@literal null}.
   */
  @Override
  public void onMessage(Message message, byte[] _pattern) {
    String channel = new String(message.getChannel());
    String body = new String(message.getBody());
    log.info("Received message on channel {}: {}", channel, body);

    if (channel.equals("cancel-notifications")) {
      processCancelNotification(body);
    }

    if (channel.equals("match-notifications")) {
      processMatchNotification(body);
    }
  }

  /**
   * Processes a match notification message.
   *
   * @param body the JSON payload of the match notification
   */
  private void processMatchNotification(String body) {
    log.debug("Received match notification: {}", body);

    MatchNotification matchNotification = null;
    try {
      String unwrapped = objectMapper.readValue(body, String.class);
      matchNotification = objectMapper.readValue(unwrapped, MatchNotification.class);
    } catch (JsonMappingException e) {
      throw new NotificationMappingException("Failed to map JSON to MatchNotification", e);
    } catch (JsonProcessingException e) {
      throw new NotificationDeserializationException("Failed to deserialize JSON for MatchNotification", e);
    }

    matchingService.handleMatchNotification(matchNotification);
    log.info("Processed match notification for {} & {}",
        matchNotification.getUser1Preference().getUserId(),
        matchNotification.getUser2Preference().getUserId());
  }

  /**
   * Processes a cancel notification message.
   *
   * @param body the JSON payload of the cancel notification (request ID)
   */
  private void processCancelNotification(String body) {
    log.debug("Received cancel notification: {}", body);
    String unwrappedRequestId = null;
    try {
      unwrappedRequestId = objectMapper.readValue(body, String.class);
    } catch (JsonMappingException e) {
      throw new NotificationMappingException("Failed to map JSON to String Request ID", e);
    } catch (JsonProcessingException e) {
      throw new NotificationDeserializationException("Failed to deserialize JSON for String Request ID", e);
    }

    matchingService.handleCancelNotification(unwrappedRequestId);
    log.info("Processed cancel-notification for request {}", unwrappedRequestId);
  }

}