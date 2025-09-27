package com.peerprep.microservices.matching;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class MatchingServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(MatchingServiceApplication.class, args);
  }

}
