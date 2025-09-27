package com.peerprep.microservices.matching.exception;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import lombok.extern.slf4j.Slf4j;

@ControllerAdvice
@Slf4j
public class DefaultExceptionHandler {

  @ExceptionHandler(UserPreferenceNotFoundException.class)
  public ResponseEntity<String> handleUserPreferenceNotFound(UserPreferenceNotFoundException ex) {
    log.error("UserPreferenceNotFoundException occurred", ex);
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
  }

  @ExceptionHandler(NoPendingMatchRequestException.class)
  public ResponseEntity<String> handleNoPendingMatchRequest(NoPendingMatchRequestException ex) {
    log.error("NoPendingMatchRequestException occurred", ex);
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
  }

  @ExceptionHandler(InvalidUserPreferenceException.class)
  public ResponseEntity<String> handleInvalidUserPreference(InvalidUserPreferenceException ex) {
    log.error("InvalidUserPreferenceException occurred", ex);
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
  }

  @ExceptionHandler(ExistingPendingMatchRequestException.class)
  public ResponseEntity<String> handleExistingPendingMatchRequest(ExistingPendingMatchRequestException ex) {
    log.error("ExistingPendingMatchRequestException occurred", ex);
    return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
  }

  @ExceptionHandler(IOException.class)
  public ResponseEntity<String> handleIoException(IOException ex) {
    log.error("IOException occurred", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body("An unexpected error occurred");
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<String> handleGeneralException(Exception ex) {
    log.error("Unexpected exception occurred", ex);
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body("An unexpected error occurred");
  }
}
