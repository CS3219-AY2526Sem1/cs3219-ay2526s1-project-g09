package com.peerprep.microservices.matching.config;

import java.time.Duration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.PatternTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.Jackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.peerprep.microservices.matching.dto.UserPreferenceResponse;
import com.peerprep.microservices.matching.event.MatchNotificationListener;

/**
 * Spring configuration for Redis integration.
 *
 * Provides beans for caching, Redis templates, and message listener containers
 * to support both cache-based and pub/sub
 * use cases in the matching service.
 */
@Configuration
public class RedisConfig {

  /**
   * Configures a {@link RedisCacheManager} for application-level caching.
   * 
   * @param connectionFactory the Redis connection factory
   * @return the configured Redis cache manager
   */
  @Bean
  public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
    RedisCacheConfiguration redisCacheConfiguration = RedisCacheConfiguration.defaultCacheConfig()
        .entryTtl(Duration.ofMinutes(10))
        .disableCachingNullValues()
        .serializeValuesWith(RedisSerializationContext.SerializationPair
            .fromSerializer(new Jackson2JsonRedisSerializer<>(UserPreferenceResponse.class)));

    return RedisCacheManager.builder(connectionFactory)
        .cacheDefaults(redisCacheConfiguration)
        .build();
  }

  /**
   * Configures a {@link RedisTemplate} for interacting with Redis directly.
   * 
   * @param connectionFactory the Redis connection factory
   * @return the configured Redis template
   */
  @Bean
  public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
    RedisTemplate<String, Object> template = new RedisTemplate<>();
    template.setConnectionFactory(connectionFactory);

    ObjectMapper mapper = new ObjectMapper();
    mapper.deactivateDefaultTyping();
    mapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
    mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    GenericJackson2JsonRedisSerializer serializer = new GenericJackson2JsonRedisSerializer(mapper);

    template.setKeySerializer(new StringRedisSerializer());
    template.setHashKeySerializer(new StringRedisSerializer());

    template.setValueSerializer(serializer);
    template.setHashValueSerializer(serializer);

    template.afterPropertiesSet();
    return template;
  }

  /**
   * Configures a {@link RedisMessageListenerContainer} for subscribing to Redis
   * pub/sub topics.
   * 
   * Subscribes to {@code match-notifications} and {@code cancel-notifications}
   * topics. Delegates message handling to
   * {@link MatchNotificationListener}.
   *
   * @param connectionFactory the Redis connection factory
   * @param messageListener   the listener to handle incoming Redis messages
   * @param channels          the channels to listen on
   * @return the configured message listener container
   */
  @Bean
  public RedisMessageListenerContainer redisContainer(
      RedisConnectionFactory connectionFactory,
      MatchNotificationListener messageListener,
      RedisChannels channels) {
    RedisMessageListenerContainer container = new RedisMessageListenerContainer();
    container.setConnectionFactory(connectionFactory);

    container.addMessageListener(messageListener, new PatternTopic(RedisChannels.MATCH_CHANNEL));
    container.addMessageListener(messageListener, new PatternTopic(RedisChannels.CANCEL_CHANNEL));
    container.addMessageListener(messageListener, new PatternTopic(RedisChannels.MATCH_ACCEPTANCE_CHANNEL));

    return container;
  }

  /**
   * Provides a Jackson {@link ObjectMapper} bean.
   *
   * @return a new {@link ObjectMapper} instance
   */
  @Bean
  public ObjectMapper objectMapper() {
    return new ObjectMapper();
  }

}
