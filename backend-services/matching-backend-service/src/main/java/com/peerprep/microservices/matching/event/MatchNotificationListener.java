package com.peerprep.microservices.matching.event;

import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.peerprep.microservices.matching.dto.MatchNotification;
import com.peerprep.microservices.matching.service.MatchingService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class MatchNotificationListener implements MessageListener {

  private final MatchingService matchingService;
  private final ObjectMapper objectMapper;

  // Handles incoming messages
  @Override
  public void onMessage(Message message, byte[] pattern) {
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

  private void processMatchNotification(String body) {
    log.debug("Received match notification: {}", body);

    MatchNotification matchNotification = null;
    try {
      String unwrapped = objectMapper.readValue(body, String.class);
      matchNotification = objectMapper.readValue(unwrapped, MatchNotification.class);

    } catch (Exception e) {
      log.error("Error processing match notification", e);
    }

    matchingService.handleMatchNotification(matchNotification);
    log.info("Processed match notification for {} & {}",
        matchNotification.getUser1Preference().getUserId(),
        matchNotification.getUser2Preference().getUserId());
  }

  private void processCancelNotification(String body) {
    log.debug("Received cancel notification: {}", body);
    String unwrappedRequestId = null;
    try {
      unwrappedRequestId = objectMapper.readValue(body, String.class);
    } catch (Exception e) {
      log.error("Error processing cancel notification", e);
    }
    matchingService.handleCancelNotification(unwrappedRequestId);
    log.info("Processed cancel-notification for request {}", unwrappedRequestId);
  }

}