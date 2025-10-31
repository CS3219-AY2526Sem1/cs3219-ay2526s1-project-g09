package com.peerprep.microservices.matching.exception;

/**
 * Exception thrown when there is an error during the mapping of notification data.
 */
public class NotificationMappingException extends RuntimeException {
  public NotificationMappingException(String message, Throwable cause) {
    super(message, cause);
  }
}