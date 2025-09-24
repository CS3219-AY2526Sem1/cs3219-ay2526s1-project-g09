package com.peerprep.microservices.matching;

import org.springframework.boot.SpringApplication;

public class TestMatchingServiceApplication {

	public static void main(String[] args) {
		SpringApplication.from(MatchingServiceApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
