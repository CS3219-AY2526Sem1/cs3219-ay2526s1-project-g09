package com.peerprep.microservices.matching.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing the final outcome of a matching request.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MatchAcceptanceOutcome {
  public enum Status {
    @JsonProperty("success")
    SUCCESS,
    @JsonProperty("rejected")
    REJECTED,
    @JsonProperty("pending")
    PENDING,
    @JsonProperty("expired")
    EXPIRED;

    @JsonCreator
    public static Status fromString(String value) {
      for (Status status : Status.values()) {
        if (status.name().equalsIgnoreCase(value)) {
          return status;
        }
      }
      throw new IllegalArgumentException("Unexpected value: " + value);
    }
  }

  private Status status;
}
