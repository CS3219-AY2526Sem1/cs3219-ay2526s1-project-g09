package com.peerprep.microservices.matching.exception;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import lombok.extern.slf4j.Slf4j;

/**
 * Global exception handler for the Matching Service.
 * Handles various custom exceptions and maps them to appropriate HTTP
 * responses.
 */
@ControllerAdvice
@Slf4j
public class DefaultExceptionHandler {

  /**
   * Handles UserPreferenceNotFoundException.
   * Returns a 404 Not Found response.
   */
  @ExceptionHandler(UserPreferenceNotFoundException.class)
  public ResponseEntity<String> handleUserPreferenceNotFound(UserPreferenceNotFoundException ex) {
    log.error("UserPreferenceNotFoundException occurred", ex);
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
  }

  /**
   * Handles NoPendingMatchRequestException.
   * Returns a 404 Not Found response.
   */
  @ExceptionHandler(NoPendingMatchRequestException.class)
  public ResponseEntity<String> handleNoPendingMatchRequest(NoPendingMatchRequestException ex) {
    log.error("NoPendingMatchRequestException occurred", ex);
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
  }

  /**
   * Handles UserPreferenceSerializationException.
   * Returns a 500 Internal Server Error response.
   */
  @ExceptionHandler(UserPreferenceSerializationException.class)
  public ResponseEntity<String> handleUserPreferenceSerialization(UserPreferenceSerializationException ex) {
    log.error("UserPreferenceSerializationException occurred", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
  }

  /**
   * Handles NotificationMappingException.
   * Returns a 500 Internal Server Error response.
   */
  @ExceptionHandler(NotificationMappingException.class)
  public ResponseEntity<String> handleNotificationMappingException(NotificationMappingException ex) {
    log.error("NotificationMappingException occurred", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
  }

  /**
   * Handles NotificationDeserializationException.
   * Returns a 500 Internal Server Error response.
   */
  @ExceptionHandler(NotificationDeserializationException.class)
  public ResponseEntity<String> handleNotificationDeserializationException(NotificationDeserializationException ex) {
    log.error("NotificationDeserializationException occurred", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
  }

  /**
   * Handles AcceptanceMappingException.
   * Returns a 500 Internal Server Error response.
   */
  @ExceptionHandler(AcceptanceMappingException.class)
  public ResponseEntity<String> handleAcceptanceMappingException(AcceptanceMappingException ex) {
    log.error("AcceptanceMappingException occurred", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
  }

  /**
   * Handles AcceptanceDeserializationException.
   * Returns a 500 Internal Server Error response.
   */
  @ExceptionHandler(AcceptanceDeserializationException.class)
  public ResponseEntity<String> handleAcceptanceDeserializationException(AcceptanceDeserializationException ex) {
    log.error("AcceptanceDeserializationException occurred", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
  }

  /**
   * Handles UserPreferenceDeserializationException.
   * Returns a 500 Internal Server Error response.
   */
  @ExceptionHandler(UserPreferenceDeserializationException.class)
  public ResponseEntity<String> handleUserPreferenceDeserializationException(
      UserPreferenceDeserializationException ex) {
    log.error("UserPreferenceDeserializationException occurred", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
  }

  /**
   * Handles IOExceptions.
   * Returns a 500 Internal Server Error response.
   */
  @ExceptionHandler(IOException.class)
  public ResponseEntity<String> handleIoException(IOException ex) {
    log.error("IOException occurred", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body("An unexpected error occurred");
  }

  /**
   * Handles all other exceptions.
   * Returns a 500 Internal Server Error response.
   */
  @ExceptionHandler(Exception.class)
  public ResponseEntity<String> handleGeneralException(Exception ex) {
    log.error("Unexpected exception occurred", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body("An unexpected error occurred");
  }
}
