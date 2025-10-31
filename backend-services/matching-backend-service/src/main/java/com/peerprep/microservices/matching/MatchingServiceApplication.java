package com.peerprep.microservices.matching;

import java.time.Duration;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextClosedEvent;

import com.peerprep.microservices.matching.service.AcceptanceService;
import com.peerprep.microservices.matching.service.GracefulShutdownService;
import com.peerprep.microservices.matching.service.MatchingService;

import lombok.extern.slf4j.Slf4j;

/**
 * Main application class for the Matching Service. This service handles user matching based on preferences and manages
 * match requests.
 */
@SpringBootApplication
@EnableCaching
@Slf4j
public class MatchingServiceApplication {

  public static void main(String[] args) {
    SpringApplication app = new SpringApplication(MatchingServiceApplication.class);

    // Register shutdown listener before context creation
    app.addListeners((ApplicationListener<ContextClosedEvent>) event -> {
      var ctx = event.getApplicationContext();
      try {
        var shutdownService = ctx.getBean(GracefulShutdownService.class);
        shutdownService.performGracefulShutdown();
      } catch (Exception e) {
        log.error("Error during coordinated shutdown", e);
      }
    });

    app.run(args);
  }
}
