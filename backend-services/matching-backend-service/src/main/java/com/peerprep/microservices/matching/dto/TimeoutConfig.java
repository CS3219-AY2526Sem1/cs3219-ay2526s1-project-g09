package com.peerprep.microservices.matching.dto;

public record TimeoutConfig(long matchRequestTimeout, long matchAcceptanceTimeout) {

}
