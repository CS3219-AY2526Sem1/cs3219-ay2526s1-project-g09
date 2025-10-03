package com.peerprep.microservices.matching.deserializers;

import java.io.IOException;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import com.peerprep.microservices.matching.dto.MatchNotification;
import com.peerprep.microservices.matching.model.UserPreference;

/**
 * Custom Jackson deserializer for {@link MatchNotification}.
 * 
 * Ensures that the required fields {@code user1RequestId},
 * {@code user2RequestId},
 * {@code user1Preference}, and {@code user2Preference} are present in the JSON
 * input. If any field is missing or {@code null}, a
 * {@link JsonMappingException}
 * is thrown with details of the invalid input.
 *
 */
public class MatchResultDeserializer extends StdDeserializer<MatchNotification> {

  private static final String USER1_REQUEST_ID = "user1RequestId";
  private static final String USER2_REQUEST_ID = "user2RequestId";
  private static final String USER1_PREFERENCE = "user1Preference";
  private static final String USER2_PREFERENCE = "user2Preference";

  /**
   * Creates a new deserializer for {@link MatchNotification}.
   */
  public MatchResultDeserializer() {
    super(MatchNotification.class);
  }

  /**
   * Deserializes a JSON structure into a {@link MatchNotification}.
   * 
   * @param jp   the JSON parser
   * @param ctxt the deserialization context
   * @return a fully populated {@link MatchNotification} instance
   * @throws IOException          if parsing fails
   * @throws JsonMappingException if any required field is missing or invalid
   */
  @Override
  public MatchNotification deserialize(JsonParser jp, DeserializationContext ctxt) throws IOException {
    JsonNode node = jp.getCodec().readTree(jp);

    String user1RequestId = getRequiredText(jp, node, USER1_REQUEST_ID);
    String user2RequestId = getRequiredText(jp, node, USER2_REQUEST_ID);
    UserPreference user1Pref = getRequiredValue(jp, node, USER1_PREFERENCE);
    UserPreference user2Pref = getRequiredValue(jp, node, USER2_PREFERENCE);

    return new MatchNotification(user1RequestId, user2RequestId, user1Pref, user2Pref);
  }

  /**
   * Extracts a required string field from the JSON node.
   *
   * @param jp        the JSON parser
   * @param node      the JSON object node
   * @param fieldName the field name to extract
   * @return the field value as a string
   * @throws JsonMappingException if the field is missing or null
   */
  private String getRequiredText(JsonParser jp, JsonNode node, String fieldName) throws JsonMappingException {
    JsonNode valueNode = node.get(fieldName);
    if (valueNode == null || valueNode.isNull()) {
      throw new JsonMappingException(jp,
          "Missing required field: " + fieldName + " in MatchResult JSON: " + node.toString());
    }
    return valueNode.asText();
  }

  /**
   * Extracts and deserializes a required {@link UserPreference} field
   * from the JSON node.
   *
   * @param jp        the JSON parser
   * @param node      the JSON object node
   * @param fieldName the field name to extract
   * @return the deserialized {@link UserPreference} instance
   * @throws IOException if deserialization fails or the field is missing
   */
  private UserPreference getRequiredValue(JsonParser jp, JsonNode node, String fieldName)
      throws IOException {
    JsonNode valueNode = node.get(fieldName);
    if (valueNode == null || valueNode.isNull()) {
      throw new JsonMappingException(jp,
          "Missing required field: " + fieldName + " in MatchResult JSON: " + node.toString());
    }
    return jp.getCodec().treeToValue(valueNode, UserPreference.class);
  }
}
