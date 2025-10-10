package com.peerprep.microservices.matching.exception;

/**
 * Exception thrown when there is an error during the deserialization of user preference JSON.
 */
public class UserPreferenceDeserializationException extends RuntimeException {
  public UserPreferenceDeserializationException(String message, Throwable cause) {
    super(message, cause);
  }
}