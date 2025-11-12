package com.peerprep.microservices.matching.config;

import java.util.Arrays;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configures Cross-Origin Resource Sharing (CORS) for the Matching service.
 */
@Configuration
public class CorsConfig {

  @Value("${allowed.origins:http://localhost:5173}")
  private String allowedOriginsEnv;

  /**
   * Creates a {@link WebMvcConfigurer} bean to register global CORS settings.
   *
   * @return the configured {@link WebMvcConfigurer}
   */
  @Bean
  public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
      @Override
      public void addCorsMappings(CorsRegistry registry) {
        String[] origins = Arrays.stream(allowedOriginsEnv.split(","))
          .map(String::trim)
          .toArray(String[]::new);

        registry.addMapping("/**")
          .allowedOrigins(origins)
          .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
          .allowedHeaders("*")
          .allowCredentials(true);
      }
    };
  }
}
