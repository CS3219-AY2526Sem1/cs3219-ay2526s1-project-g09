package com.peerprep.microservices.matching.deserializers;

import java.io.IOException;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import com.peerprep.microservices.matching.dto.MatchNotification;
import com.peerprep.microservices.matching.model.UserPreference;

public class MatchResultDeserializer extends StdDeserializer<MatchNotification> {

  public MatchResultDeserializer() {
    super(MatchNotification.class);
  }

  @Override
  public MatchNotification deserialize(JsonParser jp, DeserializationContext ctxt) throws IOException {
    JsonNode node = jp.getCodec().readTree(jp);

    String user1RequestId = node.has("user1RequestId") ? node.get("user1RequestId").asText(null) : null;
    String user2RequestId = node.has("user2RequestId") ? node.get("user2RequestId").asText(null) : null;

    UserPreference user1Pref = null;
    if (node.has("user1Preference")) {
      user1Pref = jp.getCodec().treeToValue(node.get("user1Preference"), UserPreference.class);
    }

    UserPreference user2Pref = null;
    if (node.has("user2Preference")) {
      user2Pref = jp.getCodec().treeToValue(node.get("user2Preference"), UserPreference.class);
    }

    if (user1RequestId == null) {
      throw new JsonMappingException(jp,
          "Missing required field: user1RequestId in MatchResult JSON: " + node.toString());
    }
    if (user2RequestId == null) {
      throw new JsonMappingException(jp,
          "Missing required field: user2RequestId in MatchResult JSON: " + node.toString());
    }
    if (user1Pref == null) {
      throw new JsonMappingException(jp,
          "Missing required field: user1Preference in MatchResult JSON: " + node.toString());
    }
    if (user2Pref == null) {
      throw new JsonMappingException(jp,
          "Missing required field: user2Preference in MatchResult JSON: " + node.toString());
    }

    return new MatchNotification(user1RequestId, user2RequestId, user1Pref, user2Pref);
  }

  private static java.util.Set<String> readSet(JsonNode arrayNode) {
    java.util.Set<String> set = new java.util.HashSet<>();
    if (arrayNode != null && arrayNode.isArray()) {
      arrayNode.forEach(n -> set.add(n.asText()));
    }
    return set;
  }
}
