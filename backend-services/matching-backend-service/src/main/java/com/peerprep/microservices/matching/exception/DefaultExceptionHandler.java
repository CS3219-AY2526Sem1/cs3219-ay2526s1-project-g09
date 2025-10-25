package com.peerprep.microservices.matching.exception;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import lombok.extern.slf4j.Slf4j;

/**
 * Global exception handler for the Matching Service. Handles various custom
 * exceptions and maps them to appropriate
 * HTTP responses.
 */
@ControllerAdvice
@Slf4j
public class DefaultExceptionHandler {

  /**
   * Handles UserPreferenceNotFoundException.
   * 
   * @param ex the exception that was thrown
   * @return a {@link ResponseEntity} containing the exception message and HTTP
   *         404 status
   */
  @ExceptionHandler(UserPreferenceNotFoundException.class)
  public ResponseEntity<String> handleUserPreferenceNotFound(UserPreferenceNotFoundException ex) {
    log.error("UserPreferenceNotFoundException occurred", ex);
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
  }

  /**
   * Handles NoPendingMatchRequestException.
   * 
   * @param ex the exception that was thrown
   * @return a {@link ResponseEntity} containing the exception message and HTTP
   *         404 status
   */
  @ExceptionHandler(NoPendingMatchRequestException.class)
  public ResponseEntity<String> handleNoPendingMatchRequest(NoPendingMatchRequestException ex) {
    log.error("NoPendingMatchRequestException occurred", ex);
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
  }

  /**
   * Handles UserPreferenceSerializationException.
   * 
   * @param ex the exception that was thrown
   * @return a {@link ResponseEntity} containing the exception message and HTTP
   *         500 status
   */
  @ExceptionHandler(UserPreferenceSerializationException.class)
  public ResponseEntity<String> handleUserPreferenceSerialization(UserPreferenceSerializationException ex) {
    log.error("UserPreferenceSerializationException occurred", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
  }

  /**
   * Handles NotificationMappingException.
   * 
   * @param ex the exception that was thrown
   * @return a {@link ResponseEntity} containing the exception message and HTTP
   *         500 status
   */
  @ExceptionHandler(NotificationMappingException.class)
  public ResponseEntity<String> handleNotificationMappingException(NotificationMappingException ex) {
    log.error("NotificationMappingException occurred", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
  }

  /**
   * Handles NotificationDeserializationException.
   * 
   * @param ex the exception that was thrown
   * @return a {@link ResponseEntity} containing the exception message and HTTP
   *         500 status
   */
  @ExceptionHandler(NotificationDeserializationException.class)
  public ResponseEntity<String> handleNotificationDeserializationException(NotificationDeserializationException ex) {
    log.error("NotificationDeserializationException occurred", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
  }

  /**
   * Handles AcceptanceMappingException.
   * 
   * @param ex the exception that was thrown
   * @return a {@link ResponseEntity} containing the exception message and HTTP
   *         500 status
   */
  @ExceptionHandler(AcceptanceMappingException.class)
  public ResponseEntity<String> handleAcceptanceMappingException(AcceptanceMappingException ex) {
    log.error("AcceptanceMappingException occurred", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
  }

  /**
   * Handles AcceptanceDeserializationException.
   * 
   * @param ex the exception that was thrown
   * @return a {@link ResponseEntity} containing the exception message and HTTP
   *         500 status
   */
  @ExceptionHandler(AcceptanceDeserializationException.class)
  public ResponseEntity<String> handleAcceptanceDeserializationException(AcceptanceDeserializationException ex) {
    log.error("AcceptanceDeserializationException occurred", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
  }

  /**
   * Handles UserPreferenceDeserializationException.
   * 
   * @param ex the exception that was thrown
   * @return a {@link ResponseEntity} containing the exception message and HTTP
   *         500 status
   */
  @ExceptionHandler(UserPreferenceDeserializationException.class)
  public ResponseEntity<String> handleUserPreferenceDeserializationException(
      UserPreferenceDeserializationException ex) {
    log.error("UserPreferenceDeserializationException occurred", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(ex.getMessage());
  }

  /**
   * Handles IOExceptions.
   * 
   * @param ex the exception that was thrown
   * @return a {@link ResponseEntity} containing the exception message and HTTP
   *         500 status
   */
  @ExceptionHandler(IOException.class)
  public ResponseEntity<String> handleIoException(IOException ex) {
    log.error("IOException occurred", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body("An unexpected error occurred");
  }

  /**
   * Handles all other exceptions.
   * 
   * @param ex the exception that was thrown
   * @return a {@link ResponseEntity} containing the exception message and HTTP
   *         500 status
   */
  @ExceptionHandler(Exception.class)
  public ResponseEntity<String> handleGeneralException(Exception ex) {
    log.error("Unexpected exception occurred", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body("An unexpected error occurred");
  }
}
