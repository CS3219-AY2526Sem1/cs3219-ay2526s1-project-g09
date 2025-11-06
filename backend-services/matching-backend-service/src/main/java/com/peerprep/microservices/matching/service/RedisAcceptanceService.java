package com.peerprep.microservices.matching.service;

import java.time.Duration;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.peerprep.microservices.matching.dto.MatchAcceptanceStatus;
import com.peerprep.microservices.matching.dto.MatchAcceptanceStatus.AcceptanceStatus;
import com.peerprep.microservices.matching.exception.AcceptanceDeserializationException;
import com.peerprep.microservices.matching.exception.AcceptanceMappingException;

import lombok.extern.slf4j.Slf4j;

import org.springframework.core.io.ClassPathResource;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;

/**
 * Service that manages the match acceptance pool in Redis.
 * 
 * This service stores match acceptance in a Redis pool and supports atomic operation.
 */
@Service
@Slf4j
public class RedisAcceptanceService {

  private final StringRedisTemplate redisTemplate;
  private final ObjectMapper objectMapper;
  private final DefaultRedisScript<String> updateAcceptanceScript;
  private final DefaultRedisScript<String> saveAcceptanceScript;

  private static final String MATCH_KEY_PREFIX = "match:";
  private static final String MATCHED_POOL_KEY = "matched_pool:";
  private static final Duration MATCH_EXPIRATION = Duration.ofSeconds(30);

  /**
   * Constructs a RedisAcceptanceService.
   *
   * @param redisTemplate the Redis template for performing Redis operations
   * 
   */
  public RedisAcceptanceService(StringRedisTemplate redisTemplate) throws IOException {
    this.redisTemplate = redisTemplate;
    this.objectMapper = new ObjectMapper();

    // Load Lua script for atomic update match status and save match details
    try (var scriptStream = new ClassPathResource("redis/update_match_acceptance.lua").getInputStream()) {
      String lua = new String(scriptStream.readAllBytes(), StandardCharsets.UTF_8);
      this.updateAcceptanceScript = new DefaultRedisScript<>();
      this.updateAcceptanceScript.setScriptText(lua);
      this.updateAcceptanceScript.setResultType(String.class);
    } catch (IOException e) {
      throw new IOException("Failed to load Lua script for atomic match acceptance", e);
    }

    try (var scriptStream = new ClassPathResource("redis/save_match_acceptance.lua").getInputStream()) {
      String lua = new String(scriptStream.readAllBytes(), StandardCharsets.UTF_8);
      this.saveAcceptanceScript = new DefaultRedisScript<>();
      this.saveAcceptanceScript.setScriptText(lua);
      this.saveAcceptanceScript.setResultType(String.class);
    } catch (IOException e) {
      throw new IOException("Failed to load Lua script for atomic match saving", e);
    }
  }

  /**
   * Retrieves the current match status JSON from Redis.
   * 
   * @param matchId the ID of the match
   * @return the match status JSON string, or null if not found
   */
  public MatchAcceptanceStatus getMatchStatus(String matchId) {
    String matchKey = "match:" + matchId;
    String json = redisTemplate.opsForValue().get(matchKey);
    if (json == null) {
      return null;
    }

    try {
      return objectMapper.readValue(json, MatchAcceptanceStatus.class);
    } catch (JsonMappingException e) {
      throw new AcceptanceMappingException("Failed to map JSON to MatchAcceptanceStatus", e);
    } catch (JsonProcessingException e) {
      throw new AcceptanceDeserializationException("Failed to deserialize JSON for MatchAcceptanceStatus", e);
    }
  }

  /**
   * Atomically saves both the match details and user to matchId mappings.
   * 
   * @param status the {@link MatchAcceptanceStatus} containing match details
   * @param user1Id the ID of the first user in the match
   * @param user2Id the ID of the second user in the match
   * @throws AcceptanceMappingException if serialization of {@code status} fails
   */
  public void saveMatchAcceptanceDetails(
    MatchAcceptanceStatus status,
    String user1Id,
    String user2Id) {
    String matchId = status.getMatchDetails().getMatchId();
    try {
      String json = objectMapper.writeValueAsString(status);

      String result = redisTemplate.execute(
        saveAcceptanceScript,
        List.of(MATCH_KEY_PREFIX, MATCHED_POOL_KEY),
        matchId, user1Id, user2Id, json, String.valueOf(MATCH_EXPIRATION.toSeconds()));

      if ("OK".equals(result)) {
        log.info("Saved match {} atomically with users {} and {} in matched pool", matchId, user1Id, user2Id);
      } else {
        log.warn("Unexpected Lua script result while saving match {}: {}", matchId, result);
      }

    } catch (JsonProcessingException e) {
      throw new AcceptanceMappingException("Failed to serialize MatchAcceptanceStatus to JSON", e);
    }
  }

  /**
   * Retrieves the matchId associated with a userId from the matched pool.
   * 
   * @param userId the userId to retrieve the matchId for
   * @return the matchId if found, or null if not found
   * 
   */
  public String getMatchIdFromUserId(String userId) {
    String key = MATCHED_POOL_KEY + userId;
    log.info("Retrieving matchId from Redis for userId with key {}", key);

    String matchId = redisTemplate.opsForValue().get(key);
    if (matchId == null) {
      log.info("No matchId found in matched pool for userId {}", userId);
      return null;
    }

    log.info("Found matchId {} for userId {}", matchId, userId);
    return matchId;
  }

  /**
   * Retrieves the creation timestamp (in Unix seconds) for a given matchId.
   *
   * @param matchId the ID of the match
   * @return the creation timestamp as a {@link Long}, or null if not found or invalid
   */
  public Long getTimestampFromMatchId(String matchId) {
    String timestampKey = MATCH_KEY_PREFIX + matchId + ":timestamp";
    log.info("Retrieving timestamp for matchId {} with key {}", matchId, timestampKey);

    String timestampValue = redisTemplate.opsForValue().get(timestampKey);
    if (timestampValue == null) {
      log.info("No timestamp found in Redis for matchId {}", matchId);
      return null;
    }

    try {
      Long timestamp = Long.parseLong(timestampValue);
      log.info("Found timestamp {} for matchId {}", timestamp, matchId);
      return timestamp;
    } catch (NumberFormatException e) {
      log.warn("Invalid timestamp value '{}' for matchId {}", timestampValue, matchId);
      return null;
    }
  }

  /**
   * Atomically updates acceptance or rejection in Redis using Lua.
   *
   * @param matchId The match ID
   * @param userId The user ID
   * @param newStatus ACCEPTED or REJECTED
   * @return updated MatchAcceptanceStatus
   */
  public MatchAcceptanceStatus updateAcceptance(
    String matchId, String userId, AcceptanceStatus newStatus) {

    // Pass the prefix and matchId separately to Lua
    String updatedJson = redisTemplate.execute(
      updateAcceptanceScript,
      Collections.singletonList(MATCH_KEY_PREFIX), // KEYS[1] = prefix
      matchId, // ARGV[1] = matchId
      userId, // ARGV[2] = userId
      newStatus.name() // ARGV[3] = newStatus
    );

    log.info("Updated match acceptance details for matchId {}: {}", matchId, updatedJson);
    if (updatedJson == null) {
      return null;
    }

    try {
      return objectMapper.readValue(updatedJson, MatchAcceptanceStatus.class);
    } catch (JsonMappingException e) {
      throw new AcceptanceMappingException("Failed to map JSON to MatchAcceptanceStatus", e);

    } catch (JsonProcessingException e) {
      throw new AcceptanceDeserializationException("Failed to deserialize JSON for MatchAcceptanceStatus", e);
    }
  }
}
