package com.peerprep.microservices.matching;

import java.io.IOException;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.utility.DockerImageName;

import redis.embedded.RedisServer;

@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

	@Bean
	MongoDBContainer mongoDbContainer() {
		return new MongoDBContainer(DockerImageName.parse("mongo:latest"));
	}

	@Bean(destroyMethod = "stop")
	@Primary
	RedisServer embeddedRedisServer() throws IOException {
		RedisServer server = new RedisServer(6379);
		server.start();
		return server;
	}
}
