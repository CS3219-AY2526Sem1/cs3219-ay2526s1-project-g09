package com.peerprep.microservices.matching.exception;

public class NoPendingMatchRequestException extends RuntimeException {
    public NoPendingMatchRequestException(String userId) {
        super("Pending Match Request not found for userId: " + userId);
    }
}
