package com.peerprep.microservices.matching.exception;

public class UserPreferenceNotFoundException extends RuntimeException {
    public UserPreferenceNotFoundException(String userId) {
        super("User preference not found for userId: " + userId);
    }
}
