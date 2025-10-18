package com.peerprep.microservices.matching.exception;

/**
 * Exception thrown when the user preference for a given userId is not found.
 */
public class UserPreferenceNotFoundException extends RuntimeException {
  public UserPreferenceNotFoundException(String userId) {
    super("User preference not found for userId: " + userId);
  }
}
