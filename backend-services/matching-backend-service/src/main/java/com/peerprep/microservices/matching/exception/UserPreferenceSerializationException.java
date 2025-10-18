package com.peerprep.microservices.matching.exception;

/**
 * Exception thrown when there is an error during the serialization of user preference data.
 */
public class UserPreferenceSerializationException extends RuntimeException {
  public UserPreferenceSerializationException(String message, Throwable cause) {
    super(message, cause);
  }
}