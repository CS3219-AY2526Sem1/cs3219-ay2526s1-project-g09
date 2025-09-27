package com.peerprep.microservices.matching.exception;

public class UserPreferenceMappingException extends RuntimeException {
    public UserPreferenceMappingException(String message, Throwable cause) {
        super(message, cause);
    }
}