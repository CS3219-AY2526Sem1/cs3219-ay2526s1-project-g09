package com.peerprep.microservices.matching.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.peerprep.microservices.matching.dto.MatchRedisResult;
import com.peerprep.microservices.matching.dto.UserPreferenceResponse;
import com.peerprep.microservices.matching.exception.AtomicMatchOperationException;
import com.peerprep.microservices.matching.exception.UserPreferenceDeserializationException;
import com.peerprep.microservices.matching.exception.UserPreferenceMappingException;
import com.peerprep.microservices.matching.exception.UserPreferenceSerializationException;
import com.peerprep.microservices.matching.model.UserPreference;

import lombok.extern.slf4j.Slf4j;

import org.springframework.core.io.ClassPathResource;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.util.Pair;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Service that manages the matchmaking pool in Redis.
 * 
 * This service stores user preferences in a Redis sorted set and supports
 * atomic operation.
 */
@Service
@Slf4j
public class RedisMatchService {

  private final StringRedisTemplate redisTemplate;
  private final DefaultRedisScript<String> matchScript;
  private final DefaultRedisScript<Long> removeScript;
  private final ObjectMapper objectMapper;

  private static final String MATCH_POOL_KEY = "matchmaking:pool";
  private static final String USER_PREF_KEY_PREFIX = "userpref:"; // stores full UserPreference

  /**
   * Constructs a RedisMatchService.
   *
   * @param redisTemplate the Redis template for performing Redis operations
   * @throws IOException if the Lua script for atomic match operations cannot be
   *                     loaded
   */
  public RedisMatchService(StringRedisTemplate redisTemplate) throws IOException {
    this.redisTemplate = redisTemplate;

    // Load Lua script for atomic match & remove
    String matchLua;
    try (var matchStream = new ClassPathResource("redis/match.lua").getInputStream()) {
      matchLua = new String(matchStream.readAllBytes(), StandardCharsets.UTF_8);
    } catch (IOException e) {
      throw new IOException("Failed to load Lua script for matchmaking", e);
    }
    this.matchScript = new DefaultRedisScript<>();
    this.matchScript.setScriptText(matchLua);
    this.matchScript.setResultType(String.class);

    String removeLua;
    try (var removeStream = new ClassPathResource("redis/remove.lua").getInputStream()) {
      removeLua = new String(removeStream.readAllBytes(), StandardCharsets.UTF_8);
    } catch (IOException e) {
      throw new IOException("Failed to load Lua script for matchmaking", e);
    }
    this.removeScript = new DefaultRedisScript<>();
    this.removeScript.setScriptText(removeLua);
    this.removeScript.setResultType(Long.class);

    this.objectMapper = new ObjectMapper();
  }

  /**
   * Atomically removes a user from the matchmaking pool.
   *
   * @param userId the ID of the user to remove
   * @return {@code true} if the user was removed; {@code false} otherwise
   */
  public boolean remove(String userId) {
    Long removed = redisTemplate.execute(removeScript, Collections.singletonList(MATCH_POOL_KEY), userId,
        USER_PREF_KEY_PREFIX);

    return removed != null && removed > 0;
  }

  /**
   * Atomically finds a match for the given user preference and removes the
   * matched entry, if no match found, put the request into the pool instead.
   *
   * Executes a Lua script to ensure that matching, removal and putting happen
   * atomically.
   * If a compatible match is found, it is returned as a {@link UserPreference};
   * otherwise, {@code null} is returned.
   *
   * @param request the {@link UserPreference} for which to find a match
   * @return the matched {@link UserPreference}, or {@code null} if no match
   *         exists
   * @throws UserPreferenceSerializationException   if serialization of the
   *                                                request fails
   * @throws UserPreferenceMappingException         if the matched JSON cannot be
   *                                                mapped to
   *                                                {@link UserPreference}
   * @throws UserPreferenceDeserializationException if the matched JSON cannot be
   *                                                deserialized
   */
  public MatchRedisResult match(UserPreference request, String requestId) {
    // Include requestId in the serialized JSON
    Map<String, Object> redisValue = new HashMap<>();
    redisValue.put("requestId", requestId);
    redisValue.put("userPreference", request);

    String reqJson;

    try {
      reqJson = objectMapper.writeValueAsString(redisValue);
    } catch (JsonProcessingException e) {
      throw new UserPreferenceSerializationException("Failed to serialize UserPreference", e);
    }

    // Atomically finds a match and removes the match entry
    String resultJson = redisTemplate.execute(matchScript,
        Collections.singletonList(MATCH_POOL_KEY),
        reqJson, USER_PREF_KEY_PREFIX);

    Assert.notNull(resultJson, "Redis script returned null, indicating a failure in execution");
    log.info("Match script result: {}", resultJson.toString());

    try {
      Map<String, Object> resultMap = objectMapper.readValue(resultJson, new TypeReference<>() {
      });
      Boolean oldDeleted = (Boolean) resultMap.get("oldRequestDeleted");
      String oldRequestId = (String) resultMap.get("oldRequestId");

      @SuppressWarnings("unchecked")
      Map<String, Object> matchedMap = (Map<String, Object>) resultMap.get("matched");

      if (matchedMap == null) {
        return new MatchRedisResult(oldDeleted, oldRequestId, null, null);
      }

      String matchedRequestId = (String) matchedMap.get("requestId");
      UserPreference matchedPref = objectMapper.convertValue(
          matchedMap.get("userPreference"),
          UserPreference.class);

      return new MatchRedisResult(oldDeleted, oldRequestId, matchedPref, matchedRequestId);
    } catch (JsonMappingException e) {
      throw new UserPreferenceMappingException("Failed to map JSON to UserPreference", e);
    } catch (JsonProcessingException e) {
      throw new UserPreferenceDeserializationException("Failed to deserialize JSON for UserPreference", e);
    }
  }
}
