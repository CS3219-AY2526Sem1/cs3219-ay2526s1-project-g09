package com.peerprep.microservices.matching.config;

/**
 * Contains the Redis channel names used for pub/sub communication in the matching service.
 */
public class RedisChannels {
  public static final String MATCH_CHANNEL = "match-notifications";
  public static final String CANCEL_CHANNEL = "cancel-notifications";
  public static final String MATCH_ACCEPTANCE_CHANNEL = "match-acceptance-channel";
}
