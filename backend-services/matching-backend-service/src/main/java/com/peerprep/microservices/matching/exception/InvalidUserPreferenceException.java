package com.peerprep.microservices.matching.exception;

public class InvalidUserPreferenceException extends RuntimeException {
    public InvalidUserPreferenceException(String message, Throwable cause) {
        super(message, cause);
    }
}