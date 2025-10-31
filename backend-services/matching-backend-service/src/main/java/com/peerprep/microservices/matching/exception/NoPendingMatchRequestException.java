package com.peerprep.microservices.matching.exception;

/**
 * Exception thrown when there is no pending match request for a user.
 */
public class NoPendingMatchRequestException extends RuntimeException {
  public NoPendingMatchRequestException(String userId) {
    super("Pending Match Request not found for userId: " + userId);
  }
}
