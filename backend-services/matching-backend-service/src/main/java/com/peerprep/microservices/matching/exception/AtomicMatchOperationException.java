package com.peerprep.microservices.matching.exception;

public class AtomicMatchOperationException   extends RuntimeException {
    public AtomicMatchOperationException  (String message, Throwable cause) {
        super(message, cause);
    }
}