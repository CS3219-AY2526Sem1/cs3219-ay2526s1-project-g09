package com.peerprep.microservices.matching.exception;

/**
 * Exception thrown when there is an error during the deserialization of
 * acceptance redis data.
 */
public class AcceptanceDeserializationException extends RuntimeException {
  public AcceptanceDeserializationException(String message, Throwable cause) {
    super(message, cause);
  }
}