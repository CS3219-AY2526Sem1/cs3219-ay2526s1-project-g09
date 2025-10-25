package com.peerprep.microservices.matching.config;

import org.springframework.stereotype.Component;

/**
 * Contains the Redis channel names used for pub/sub communication in the matching service.
 */
@Component
public class RedisChannels {
  public final String MATCH_CHANNEL = "match-notifications";
  public final String CANCEL_CHANNEL = "cancel-notifications";
  public final String MATCH_ACCEPTANCE_CHANNEL = "match-acceptance-channel";
}
