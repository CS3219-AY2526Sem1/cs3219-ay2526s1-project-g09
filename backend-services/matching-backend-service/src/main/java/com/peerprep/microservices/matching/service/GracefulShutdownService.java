package com.peerprep.microservices.matching.service;

import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class GracefulShutdownService {

  private final MatchingService matchingService;
  private final AcceptanceService acceptanceService;

  private volatile boolean shuttingDown = false;

  /**
   * Triggered on ContextClosedEvent to orchestrate graceful shutdown.
   */
  public void performGracefulShutdown() {
    if (shuttingDown) {
      log.warn("Shutdown already in progress.. Skipping duplicate invocation.");
      return;
    }

    shuttingDown = true;
    log.info("Instance marked as shutting down.. Rejecting new match requests.");

    Thread shutdownThread = new Thread(() -> {
      try {
        Duration timeout = Duration.ofSeconds(120);
        log.info("Waiting up to {} seconds for ongoing requests to complete...", timeout.getSeconds());

        CompletableFuture<Void> matchFuture = CompletableFuture
          .runAsync(() -> matchingService.awaitTermination(timeout));
        CompletableFuture<Void> acceptanceFuture = CompletableFuture
          .runAsync(() -> acceptanceService.awaitTermination(timeout));

        CompletableFuture.allOf(matchFuture, acceptanceFuture)
          .orTimeout(timeout.toSeconds(), TimeUnit.SECONDS)
          .join();

        log.info("Graceful shutdown complete. All operations finished.");
      } catch (Exception e) {
        log.error("Error during graceful shutdown process", e);
      }
    }, "GracefulShutdownCoordinator");

    shutdownThread.start();

    try {
      shutdownThread.join();
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      log.warn("Shutdown thread interrupted", e);
    }
  }

  public boolean isShuttingDown() {
    return shuttingDown;
  }
}
