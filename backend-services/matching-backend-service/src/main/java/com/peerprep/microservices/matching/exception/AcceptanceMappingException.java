package com.peerprep.microservices.matching.exception;

/**
 * Exception thrown when there is an error during the mapping of acceptance
 * JSON.
 */
public class AcceptanceMappingException extends RuntimeException {
  public AcceptanceMappingException(String message, Throwable cause) {
    super(message, cause);
  }
}