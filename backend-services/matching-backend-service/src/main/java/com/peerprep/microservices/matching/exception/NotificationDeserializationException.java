package com.peerprep.microservices.matching.exception;

/**
 * Exception thrown when there is an error during the deserialization of notification data.
 */
public class NotificationDeserializationException extends RuntimeException {
  public NotificationDeserializationException(String message, Throwable cause) {
    super(message, cause);
  }
}