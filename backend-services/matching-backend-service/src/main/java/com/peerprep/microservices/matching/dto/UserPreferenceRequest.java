package com.peerprep.microservices.matching.dto;

import java.util.Set;

public record UserPreferenceRequest(String userId, Set<String> topics, Set<String> difficulties, int minTime,
    int maxTime) {

}
