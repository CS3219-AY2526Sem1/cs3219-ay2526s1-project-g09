package com.peerprep.microservices.matching.exception;

/**
 * Exception thrown when there is an error during the mapping of user preference JSON.
 */
public class UserPreferenceMappingException extends RuntimeException {
  public UserPreferenceMappingException(String message, Throwable cause) {
    super(message, cause);
  }
}