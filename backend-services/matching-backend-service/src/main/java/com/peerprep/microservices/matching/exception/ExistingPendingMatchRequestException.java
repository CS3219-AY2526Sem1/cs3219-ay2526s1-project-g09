package com.peerprep.microservices.matching.exception;

public class ExistingPendingMatchRequestException extends RuntimeException {
    public ExistingPendingMatchRequestException(String userId) {
        super("Pending Match Request already exists for userId: " + userId);
    }
}
