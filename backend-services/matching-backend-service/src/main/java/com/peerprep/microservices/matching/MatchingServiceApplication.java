package com.peerprep.microservices.matching;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

/**
 * Main application class for the Matching Service. This service handles user matching based on preferences and manages
 * match requests.
 */
@SpringBootApplication
@EnableCaching
public class MatchingServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(MatchingServiceApplication.class, args);
  }

}
