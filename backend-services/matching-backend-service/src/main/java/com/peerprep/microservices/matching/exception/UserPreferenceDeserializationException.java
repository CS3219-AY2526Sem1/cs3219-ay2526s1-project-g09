package com.peerprep.microservices.matching.exception;

public class UserPreferenceDeserializationException extends RuntimeException {
    public UserPreferenceDeserializationException(String message, Throwable cause) {
        super(message, cause);
    }
}