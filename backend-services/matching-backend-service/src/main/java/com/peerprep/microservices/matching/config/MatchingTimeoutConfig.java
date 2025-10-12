package com.peerprep.microservices.matching.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import lombok.Data;

@Configuration
@ConfigurationProperties(prefix = "matching.timeouts")
@Data
public class MatchingTimeoutConfig {
  /**
   * Timeout for finding a match (in milliseconds)
   */
  private long matchRequest = 30_000; // 30 seconds

  /**
   * Timeout for match acceptance (in milliseconds)
   */
  private long matchAcceptance = 30_000; // 30 seconds
}