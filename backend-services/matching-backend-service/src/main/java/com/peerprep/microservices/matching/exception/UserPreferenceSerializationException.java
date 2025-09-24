package com.peerprep.microservices.matching.exception;

public class UserPreferenceSerializationException  extends RuntimeException {
    public UserPreferenceSerializationException (String message, Throwable cause) {
        super(message, cause);
    }
}