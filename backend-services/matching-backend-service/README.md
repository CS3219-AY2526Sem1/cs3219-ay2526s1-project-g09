# PeerPrep - Matching Backend Service

Spring Boot service that:

- Provides structured RESTful API endpoints
- Manages user preferences and match acceptance
- Maintains user preference database with MongoDB Atlas
- Uses Redis for matching and match acceptance with Redis

## Tech

- Java 17+
- Spring Boot 3+
- Lombok
- Redis

## Running Matching Service

**Before running** check for the following requirements:

- Java 17 or higher
- Maven
- MongoDB Atlas
- Redis (6379)
- Docker

1. Open Command Line/Terminal and navigate into the `matching-backend-service` directory.

2. Run the command: `mvn clean install`. This will install all the necessary dependencies.

3. Run the command: `docker run -d -p 6379:6379 valkey/valkey:8.0`. This will start a Redis container.

4. Clone `.env.example` and rename as `.env`.

5. Replace <db_password> with your MongoDB Atlas account password. Replace <gmail_account> with your Gmail address. Replace <client_id>, <client_secret> and <refresh_token> with the respective values from OAuth Provider. Gmail OAuth setup guide can be found [here](https://dev.to/chandrapantachhetri/sending-emails-securely-using-node-js-nodemailer-smtp-gmail-and-oauth2-g3a)

6. Replace ‘SPRING_DATA_REDIS_HOST=redis’ with ‘SPRING_DATA_REDIS_HOST=redis/localhost’

7. Run the command `mvn spring-boot:run` to start the Matching Service.

8. Using applications like Postman, you can interact with the Matching Service on port 5274. If you wish to change this, please update the `.env` file.

## Running with Docker

1. Follow steps 1 to 6 from [Running Matching Service](#running-matching-service).

2. Run `docker compose up --build`.

3. Using applications like Postman, you can interact with the Matching Service on port 5274. If you wish to change this, please update the `.env` file.

## Project Structure

```
src/main/
  resources/redis/
    match.lua                                 # Atomically handles the matching transaction
    remove.lua                                # Atomically handles removing of match requests
    save_match_acceptance.lua                 # Atomically handles creation of a match acceptance process
    update_match_acceptance.lua               # Atomically handles updating of a match acceptance status


  java/com/peerprep/microservices/
  MatchingServiceApplication.java             # Starts the application


  client/
    CollabServiceClient.java                  # Handles API calls to the collab service
    MatchingTimeoutConfig.java                # Specifies the duration for timeouts in the service
    RedisChannel.java                         # Specifies the Redis channel names used for publisher-subscriber communication
    RedisConfig.java                          # The configuration for Redis integration
    RestTemplateConfig.java                   # Creates a rest template


  controller/
    MatchingServiceController.java            # Handles all API uris and routes


  deserializers/
    MatchResultDeserializer.java              # Handles deserialization from json into java objects


  dto/
    AcceptanceNotification.java               # Represents an update to the status of match acceptance for Redis publisher-subscriber
    CollabStartRequest.java                   # Represents the request payload for creating a collaboration session
    CollabStartResponse.java                  # Indicates whether a collaboration session was created successfully
    MatchAcceptanceOutcome.java               # Represents the final outcome of a match acceptance
    MatchAcceptanceRequest.java               # Represents the request payload to accept the match
    MatchAcceptanceResponse.java              # Indicates the outcome of a match acceptance
    MatchAccetanceStatus.java                 # Indicates the status of the users' match acceptance
    MatchDetails.java                         # Indicates the details of a match
    MatchingNotification.java                 # Represents the result of a successful match for Redis publisher-subscriber
    MatchingOutcome.java                      # Indicates the outcome of a match request
    MatchingRedisResult.java                  # Indicates the result of a Redis matching transaction
    RemoveMatchingResult.java                 # Indicates the result of a remove operation
    TimeoutConfig.java                        # Represents the timeout configuration
    UserPreferenceRequest.java                # Represents the request payload for a user's matching preferences
    UserPreferenceResponse.java               # Represents the updated matching preferences


  event/
    MatchingNotificationListener.java         # The Redis message listerner for matching-related notifications


  exception/
    AcceptanceDeserializationException.java   # Exception for deserializing match acceptance from JSON into Java objects
    AcceptanceMappingException.java           # Exception for mapping match acceptance from JSON into Java objects
    DefaultExceptionHandler.java              # Generic handler for exceptions
    NoPendingMatchRequestException.java       # Exception for removing a match request that does not exist
    NotificationDeserializationException.java # Exception for deserializing Redis publisher-subscriber payloads
    NotificationMappingException.java         # Exception for mapping Redis publisher-subscriber payloads to Java objects
    UserPreferenceDeserialization.java        # Exception for deserializing user preferences from JSON into Java objects
    UserPreferenceMappingException.java       # Exception for mapping user preferences from JSON into Java objects
    UserPreferenceSerializationException.java # Exception for serializing user preferences into JSON


  model/
    QuestionPreference.java                   # Represents question preferences for matching
    UserPreference.java                       # Represents a user's preference for matching


  respository/
    MatchingRepository.java                   # The database operations for matching service

  service/
    AcceptanceService.java                    # Handles operations related to acceptance
    HealthService.java                        # Handles operations related to health of matching service
    MatchingService.java                      # Handles operations related to matching
    RedisAcceptanceService.java               # Handles operations related to Redis for acceptance operations
    RedisMatchingService.java                 # Handles operations related to Matching for matching operations
    UserPreferenceService                     # Handles operations related to user preferences for matching
```

## API Overview

Base URL: `http://localhost:5274/api/v1/matching-service`

## API Reference

### Get the service status

- Usage: **GET** `http://localhost:5274/api/v1/matching-service/health`

- Behaviour: Checks if the service is currently up.

- Expected Response:
  - HTTP STATUS 200 OK: The service is up.

  ```json
  {
    "service": "matching-service",
    "uptimeSeconds": 3590.9023,
    "status": "UP",
    "timestamp": 1783490
  }
  ```

### Get the service readiness

- Usage: **GET** `http://localhost:5274/api/v1/matching-service/health/ready`

- Behaviour: Checks if services that matching depends on are currently up.

- Expected Response:
  - HTTP STATUS 200 OK: The service dependencies are up.

    ```json
    {
      "service": "matching-service",
      "collabService": "UP",
      "status": "UP"
    }
    ```

  - HTTP STATUS 503 SERVICE UNAVAILABLE: The service dependencies are down.

    ```json
    {
      "service": "matching-service",
      "collabService": "DOWN (ResourceAccessException)",
      "status": "DEGRADED"
    }
    ```

### Getting configuration

- Usage: **GET** `http://localhost:5274/api/v1/matching-service/config`

- Behaviour: Fetches timeout configurations for match requests and acceptance windows.

- Expected Response:
  - HTTP STATUS 200 OK: The configurations are successfully retrieved.

    ```json
    {
      "matchRequestTimeout": 30000,
      "matchAcceptanceTimeout": 30000
    }
    ```

### Create or Update User Preference

- Usage: **PUT** `http://localhost:5274/api/v1/matching-service/preferences/{userId}`

- Behaviour: Updates an existing user preference or creates a new one if it does not exist. This endpoint allows clients to upsert user-specific matching preferences for topics and corresponding difficulties.

- Parameters

  | Name     | Type     | Required | Description                                              |
  | -------- | -------- | -------- | -------------------------------------------------------- |
  | `userId` | `string` | Yes      | The ID of the user whose preferences are being upserted. |

- Body

  | Name     | Type     | Required | Description                                                                         |
  | -------- | -------- | -------- | ----------------------------------------------------------------------------------- |
  | `userId` | `string` | Yes      | The ID of the user whose topic preferences are being upserted.                      |
  | `topics` | `object` | Yes      | A mapping of topic names to arrays of difficulty levels (e.g., Easy, Medium, Hard). |

  ```json
  {
    "userId": "sampleUserId",
    "topics": {
      "Algorithms": ["Easy", "Medium", "Hard"],
      "Database": ["Easy"]
    }
  }
  ```

- Expected Response:
  - HTTP STATUS 200 OK:
    The user preference was successfully updated or created. Returns the user preference inserted.

    ```json
    {
      "userId": "sampleUserId",
      "topics": {
        "Algorithms": ["Easy", "Medium", "Hard"],
        "Database": ["Easy"]
      }
    }
    ```

### Get User Preferences

- Usage: **GET** `http://localhost:5274/api/v1/matching-service/preferences/{userId}`

- Behaviour: Retrieves the saved user preference for the specified user.

- Parameters

  | Name     | Type     | Required | Description                                               |
  | -------- | -------- | -------- | --------------------------------------------------------- |
  | `userId` | `string` | Yes      | The ID of the user whose preferences are being retrieved. |

- Expected Response:
  - HTTP STATUS 200 OK:
    The user preference was successfully retrieved.

    ```json
    {
      "userId": "sampleUserId",
      "topics": {
        "Algorithms": ["Easy", "Medium", "Hard"],
        "Database": ["Easy"]
      }
    }
    ```

### Delete User Preference

- Usage: **DELETE** `http://localhost:5274/api/v1/matching-service/preferences/{userId}`

- Behaviour: Deletes the saved user preference for the specified user.

- Parameters

  | Name     | Type     | Required | Description                                             |
  | -------- | -------- | -------- | ------------------------------------------------------- |
  | `userId` | `string` | Yes      | The ID of the user whose preferences are being deleted. |

- Expected Response:
  - HTTP STATUS 204 NO CONTENT:
    User preference successfully deleted.

  - HTTP STATUS 404 NOT FOUND: User preference was not found
    ```
    User Preference was not found for userId: sampleUserId
    ```

### Request Match

- Usage: **PUT** `http://localhost:5274/api/v1/matching-service/match-requests`

- Behaviour: Attempts to find a compatible match for a user through long polling based on their submitted preferences.

- Body

  | Name     | Type     | Required | Description                                                                         |
  | -------- | -------- | -------- | ----------------------------------------------------------------------------------- |
  | `userId` | `string` | Yes      | The ID of the user who is requesting the match.                                     |
  | `topics` | `object` | Yes      | A mapping of topic names to arrays of difficulty levels (e.g., Easy, Medium, Hard). |

  ```json
  {
    "userId": "sampleUserId",
    "topics": {
      "Algorithms": ["Easy", "Medium", "Hard"],
      "Database": ["Easy"]
    }
  }
  ```

- Expected Response:
  - HTTP STATUS 200 OK:
    A compatible match where preferences overlapped was found successfully. Returns the match details and overlapping preferences.

    ```json
    {
      "status": "MATCHED",
      "match": {
        "userId": "sampleUserId2",
        "topics": {
          "Database": ["Easy"]
        }
      },
      "matchId": "1cc1401c-9654-491b-ac72-fb8ac8fc4443"
    }
    ```

  - HTTP STATUS 202 ACCEPTED:
    The match request has timed out.

    ```
    No match found (timeout)
    ```

  - HTTP STATUS 410 GONE:
    The match request was cancelled.

    ```
    Match request was cancelled
    ```

  - HTTP STATUS 500 INTERNAL SERVER ERROR:
    An unexpected error has occurred in the service.
    ```
    An unexpected error occurred
    ```

### Cancel Match

- Usage: **DELETE** `http://localhost:5274/api/v1/matching-service/match-requests/{userId}`

- Behaviour: Cancels a user's pending match request, if one exists in the matching pool.

- Parameters

  | Name     | Type     | Required | Description                                                |
  | -------- | -------- | -------- | ---------------------------------------------------------- |
  | `userId` | `string` | Yes      | The ID of the user whose match request is being cancelled. |

- Expected Response:
  - HTTP STATUS 204 NO CONTENT:
    Match request successfully deleted.

  - HTTP STATUS 404 NOT FOUND: No match request found
    ```
    Pending Match Request not found for userId: sampleUserId
    ```

### Connect to Match Acceptance

- Usage: **POST** `http://localhost:5274/api/v1/matching-service/match-requests/{userId}/connect`

- Behaviour: Connects a specified user to the match acceptance process after having been matched.

- Parameters

  | Name     | Type     | Required | Description                                                           |
  | -------- | -------- | -------- | --------------------------------------------------------------------- |
  | `userId` | `string` | Yes      | The ID of the user who is connecting to the match acceptance process. |

- Body

  | Name      | Type     | Required | Description                          |
  | --------- | -------- | -------- | ------------------------------------ |
  | `matchId` | `string` | Yes      | The ID of the match to be connected. |

  ```json
  {
    "matchId": "match-10239"
  }
  ```

- Expected Response:
  - HTTP STATUS 202 ACCEPTED:
    Connection to the match acceptance process is pending. Note: this status is to ensure a default return value, but should not be returned under normal circumstances.

    ```json
    {
      "status": "pending"
    }
    ```

  - HTTP STATUS 200 OK:
    The match connection was accepted.

    ```json
    {
      "status": "success"
    }
    ```

  - HTTP STATUS 409 CONFLICT:
    The match connection was rejected.

    ```json
    {
      "status": "rejected"
    }
    ```

  - HTTP STATUS 410 GONE:
    The match connection is expired.

    ```json
    {
      "status": "expired"
    }
    ```

  - HTTP STATUS 500 Internal Server Error:
    The matchId does not exist, has expired or the supplied userId does not belong to the match acceptance process.
    ```
    An unexpected error occurred
    ```

### Accept match

- Usage: **PUT** `http://localhost:5274/api/v1/matching-service/match-requests/{userId}/accept`

- Behaviour: Accepts a match request for a specified user.

- Parameters

  | Name     | Type     | Required | Description                                     |
  | -------- | -------- | -------- | ----------------------------------------------- |
  | `userId` | `string` | Yes      | The ID of the user accepting the match request. |

- Body

  | Name      | Type     | Required | Description                         |
  | --------- | -------- | -------- | ----------------------------------- |
  | `matchId` | `string` | Yes      | The ID of the match to be accepted. |

  ```json
  {
    "matchId": "match-10239"
  }
  ```

- Expected Response:
  - HTTP STATUS 200 OK:
    The match has been accepted. Returns the updated acceptance status of both users

    ```json
    {
      "matchDetails": {
        "matchId": "eba18f5d-8330-408b-8e22-5ec844561883",
        "user1Id": "sampleUserId",
        "user2Id": "sampleUserId2",
        "questionPreference": {
          "topics": {
            "Database": ["Medium"]
          }
        }
      },
      "user1Accepted": "ACCEPTED",
      "user2Accepted": "CONNECTED"
    }
    ```

  - HTTP STATUS 500 Internal Server Error:
    The matchId does not exist, has expired or the supplied userId does not belong to the match acceptance process.

    ```
    An unexpected error occurred
    ```

### Reject match

- Usage: **PUT** `http://localhost:5274/api/v1/matching-service/match-requests/{userId}/reject`

- Behaviour: Accepts a match request for a specified user.

- Parameters

  | Name     | Type     | Required | Description                                     |
  | -------- | -------- | -------- | ----------------------------------------------- |
  | `userId` | `string` | Yes      | The ID of the user accepting the match request. |

- Body

  | Name      | Type     | Required | Description                                |
  | --------- | -------- | -------- | ------------------------------------------ |
  | `matchId` | `string` | Yes      | The unique ID of the match to be rejected. |

  ```json
  {
    "matchId": "match-10239"
  }
  ```

- Expected Response:
  - HTTP STATUS 204 NO CONTENT:
    The match has been successfully rejected.

  - HTTP STATUS 500 INTERNAL SERVER ERROR:
    The matchId does not exist, has expired or the supplied userId does not belong to the match acceptance process.
    ```
    An unexpected error occurred
    ```
