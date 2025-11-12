# PeerPrep - Collab Backend Service

Node.js service that:

- Creates and manages collaboration sessions initiated by the Matching backend
- Hosts a Socket.IO (websocket-only) endpoint backed by Yjs for CRDT editing, cursors, and awareness
- Coordinates with the Question service (random question selection) and History service (session snapshots)
- Persists active session metadata in MongoDB and optionally fan-outs updates through Redis for horizontal scaling

## Tech

- Node.js 18+
- Express 5 + Mongoose 8
- Socket.IO 4 (websocket transport only)
- Yjs 13
- MongoDB / MongoDB Atlas
- Redis (optional, enables multi-instance sync for horizontal scaling)
- Vitest + Supertest

## Running Collab Service

**Before running** make sure you have:

- Node.js 18 or higher and npm
- Access to a MongoDB cluster (`MONGO_URI`)
- The Question backend URL (`QUESTION_SERVICE_URL`) reachable from this service
- (Optional but recommended) the History backend URL (`HISTORY_SERVICE_URL`) to persist final code snapshots
- (Optional) Redis 6+ if you plan to run multiple collab instances
- Docker Desktop if you want to spin up Redis or run everything via Compose

1. Open a terminal and navigate to `backend-services/collab-backend-service`.
2. Install dependencies: `npm install`.
3. Copy the sample environment file: `cp .env.example .env`.
4. Edit `.env` and fill in:
   - `MONGO_URI` with your Mongo connection string
   - `QUESTION_SERVICE_URL` pointing to the question service (e.g. `http://localhost:5275/api/v1/question-service`)
   - `HISTORY_SERVICE_URL` pointing to the history service (optional, but required for persistence)
   - Set `REDIS_HOST` / `REDIS_PORT` or `COLLAB_REDIS_URL` if using Redis
5. (Optional) Start Redis locally: `docker run -d -p 6379:6379 valkey/valkey:8.0`.
6. Launch the service: `node src/server.js`. The HTTP API listens on `PORT` (default `5276`).
7. Validate the deployment:

   ```bash
   curl http://localhost:5276/api/v1/collab-service/health
   ```

## Running with Docker

1. Complete steps 1–4 from [Running Collab Service](#running-collab-service).
2. From the repository root run `docker compose up --build collab-backend-service`.
3. The container exposes the service on port `5276` by default (see `docker-compose.yml`). Update `.env` if you need a different port.
4. Use Postman/curl to call `http://localhost:5276/api/v1/collab-service/...` or point the Matching backend to this host.

## Environment Variables

| Name                                            | Required            | Description                                                      |
| ----------------------------------------------- | ------------------- | ---------------------------------------------------------------- |
| `MONGO_URI`                                     | Yes                 | MongoDB connection string used by Mongoose                       |
| `PORT`                                          | No (default `5276`) | HTTP port for Express + Socket.IO                                |
| `QUESTION_SERVICE_URL`                          | Yes                 | Base URL of the Question service (`.../api/v1/question-service`) |
| `HISTORY_SERVICE_URL`                           | No                  | Base URL of the History service (`.../api/v1/history-service`)   |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_TLS_ENABLED` | No                  | Redis adapter settings for Socket.IO/Yjs replication             |
| `COLLAB_REDIS_URL`                              | No                  | Alternative single-string Redis connection URL                   |
| `SHUTDOWN_TIMEOUT_MS`, `INACTIVITY_TIMEOUT_MS`  | No                  | Optional overrides for graceful shutdown and inactivity sweeps   |

## Project Structure

```
src/
  app.js                          Express app + middleware wiring
  server.js                       Boots HTTP + Socket.IO and graceful shutdown
  config/db.js                    Mongo connection helper
  controllers/collab.controller.js
  routes/collab.routes.js         REST endpoints mounted under /api/v1/collab-service
  models/session.model.js         Session schema (question metadata + participants)
  services/
    session.service.js            Session CRUD, connect/disconnect lifecycle
    sessionHistory.service.js     Formats and posts snapshots to History service
    history.client.js             Fetch wrapper for HISTORY_SERVICE_URL
    redis.service.js              Configures Socket.IO Redis adapter
    yjsRedis.service.js           Publishes/subscribes Yjs updates via Redis
  sockets/
    collab.socket.js              Attaches events and room lifecycle handlers
    socketServer.js               Socket.IO server configuration (websocket-only)
    socketEvents.js               joinRoom/yjsUpdate/cursor/awareness handlers
    yjsSync.js                    In-memory Yjs docs + snapshot cache
    activityTracker.js            Heartbeat + inactivity eviction logic
  utils/session.utils.js          Shared helpers (Yjs encoding, ID utilities)
tests/
  setup-env.ts
  session.utils.test.js
  yjsSync.test.js
```

## API Overview

Base URL: `http://localhost:5276/api/v1/collab-service`

## API Reference

### Health check

- Usage: **GET** `http://localhost:5276/api/v1/collab-service/health`
- Behaviour: Returns service status plus uptime information.
- Expected response:

  ```json
  {
    "status": "ok",
    "uptime": 123.45,
    "timestamp": "2024-10-09T03:21:34.123Z"
  }
  ```

### Readiness check

- Usage: **GET** `http://localhost:5276/api/v1/collab-service/health/ready`
- Behaviour: Pings the Question service health endpoint. Responds with `200 OK` when dependencies are healthy, otherwise `503 Service Unavailable`.
- Expected response (`200 OK`):

  ```json
  {
    "service": "collab-service",
    "status": "ok",
    "dependencies": {
      "questionService": "UP"
    },
    "timestamp": "2024-10-09T03:21:34.123Z"
  }
  ```

### Start session

- Usage: **POST** `http://localhost:5276/api/v1/collab-service/start`
- Behaviour: Creates (or reuses) a collaboration session for the supplied users. If `questionId` is missing, the service calls the Question backend `/random` endpoint using `questionPreferences`.
- Body

  | Name                  | Type                       | Required    | Description                                                                                                |
  | --------------------- | -------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------- |
  | `users`               | `string[]`                 | Yes         | List of participants in the session                                                                        |
  | `questionId`          | `string`                   | Conditional | Provide if you already know the question to load                                                           |
  | `questionPreferences` | `Record<string, string[]>` | Conditional | Used to fetch a random question. Keys are topics, values are difficulty arrays (`Easy`, `Medium`, `Hard`). |
  | `sessionId`           | `string`                   | No          | Optional stable identifier when rehydrating an existing room                                               |

- Example request:

  ```json
  {
    "users": ["user-1", "user-2"],
    "questionPreferences": {
      "Arrays": ["Medium", "Hard"],
      "Graphs": ["Medium"]
    }
  }
  ```

- Expected responses:
  - `201 Created`:

    ```json
    {
      "success": true
    }
    ```

  - `400 Bad Request`: missing `questionId`/preferences or `users`.
  - `502 Bad Gateway`: Question service failed to return a random question.
  - `500 Internal Server Error`: Any other error while creating the session.

### Connect session

- Usage: **POST** `http://localhost:5276/api/v1/collab-service/connect/{userId}`
- Behaviour: Marks a participant as active in an existing session (used when the UI reconnects).
- Parameters

  | Name     | Type     | Required | Description              |
  | -------- | -------- | -------- | ------------------------ |
  | `userId` | `string` | Yes      | User that just connected |

- Body

  | Name        | Type     | Required | Description       |
  | ----------- | -------- | -------- | ----------------- |
  | `sessionId` | `string` | Yes      | Session to rejoin |

- Expected responses:
  - `200 OK`:

    ```json
    {
      "success": true,
      "session": {
        "sessionId": "eba18f5d-8330-408b-8e22-5ec844561883",
        "questionId": "two-sum",
        "participants": [
          {
            "userId": "user-1",
            "active": true,
            "lastSeenAt": "2024-10-09T03:20:00.000Z",
            "sessionId": "eba18f5d-8330-408b-8e22-5ec844561883"
          }
        ],
        "createdAt": "2024-10-09T03:15:27.000Z",
        "active": true
      },
      "addedUser": "user-1"
    }
    ```

  - `400 Bad Request`: missing `userId` or `sessionId`.
  - `404 Not Found`: session does not exist or the user is not part of it.

### Disconnect session

- Usage: **POST** `http://localhost:5276/api/v1/collab-service/disconnect/{userId}`
- Behaviour: Removes a participant from a session. When the last participant leaves or `force` is `true`, the session ends and (if configured) the final code snapshot is persisted to the History service.
- Parameters

  | Name     | Type     | Required | Description                                                           |
  | -------- | -------- | -------- | --------------------------------------------------------------------- |
  | `userId` | `string` | No       | User leaving the session. Optional when `force` ending by session ID. |

- Body

  | Name        | Type      | Required | Description                                 |
  | ----------- | --------- | -------- | ------------------------------------------- |
  | `sessionId` | `string`  | Yes      | Session being disconnected                  |
  | `force`     | `boolean` | No       | End the entire session immediately          |
  | `finalCode` | `string`  | No       | Latest code snapshot supplied by the client |
  | `language`  | `string`  | No       | Language for the final snapshot metadata    |

- Expected responses:
  - `200 OK`:

    ```json
    {
      "success": true,
      "session": {
        "sessionId": "eba18f5d-8330-408b-8e22-5ec844561883",
        "active": false,
        "endedAt": "2024-10-09T03:45:11.000Z"
      },
      "ended": true,
      "removedUser": "user-1"
    }
    ```

  - `400 Bad Request`: missing `sessionId`.
  - `404 Not Found`: session not found.
  - `500 Internal Server Error`: persistence failures or other errors.

### Get active session for user

- Usage: **GET** `http://localhost:5276/api/v1/collab-service/sessions/{userId}`
- Behaviour: Retrieves the active session that still tracks the specified user.
- Expected responses:
  - `200 OK`:

    ```json
    {
      "success": true,
      "session": {
        "sessionId": "eba18f5d-8330-408b-8e22-5ec844561883",
        "questionId": "two-sum",
        "question": {
          "title": "Two Sum",
          "difficulty": "Easy",
          "topics": ["Arrays"]
        },
        "participants": [
          {
            "userId": "user-1",
            "active": true,
            "lastSeenAt": "2024-10-09T03:35:11.000Z"
          }
        ],
        "createdAt": "2024-10-09T03:15:27.000Z",
        "active": true
      }
    }
    ```

  - `400 Bad Request`: missing `userId`.
  - `404 Not Found`: user has no active session.

### Get session by ID

- Usage: **GET** `http://localhost:5276/api/v1/collab-service/{sessionId}`
- Behaviour: Returns the full session document, including participants and question metadata. Used by monitoring/countdown UIs.
- Expected responses:
  - `200 OK` same payload as above.
  - `404 Not Found`: session does not exist.

## Socket.IO Events

- **Path**: `/api/v1/collab-service/socket.io`
- **Transport**: Websocket only (polling is disabled). Provide `extraHeaders.Authorization` if you enforce auth upstream.

| Event             | Direction       | Payload                                    | Description                                                                           |
| ----------------- | --------------- | ------------------------------------------ | ------------------------------------------------------------------------------------- |
| `joinRoom`        | client → server | `{ sessionId, userId }`                    | Joins the Socket.IO room and registers the participant.                               |
| `yjsInit`         | server → client | `{ stateVector, encodedUpdate, language }` | Snapshot sent immediately after `joinRoom` so editors can hydrate Yjs state.          |
| `yjsUpdate`       | bidirectional   | `{ update, language, authorId }`           | Base64-encoded Yjs update propagated to every participant and cached for persistence. |
| `cursorUpdate`    | client → server | `{ userId, cursor, selection }`            | Broadcast (throttled) cursor/selection metadata to peers.                             |
| `awarenessUpdate` | bidirectional   | Raw Yjs awareness payload                  | Mirrors the Yjs awareness protocol for presence states.                               |
| `heartbeat`       | client → server | `{ sessionId, userId }`                    | Must be emitted every ≤30s to avoid inactivity eviction.                              |
| `inactiveTimeout` | server → client | `{ sessionId }`                            | Fired when a participant misses heartbeats for 5 minutes (`INACTIVITY_TIMEOUT_MS`).   |
| `participantLeft` | server → room   | `{ sessionId, userId }`                    | Indicates a single participant disconnected or was evicted.                           |
| `sessionEnded`    | server → room   | `sessionId`                                | Emitted when the session terminates (all users gone or forced).                       |
| `sessionCreated`  | server → all    | `session`                                  | Broadcast whenever the REST API creates a new session. Useful for admin dashboards.   |

## Quality Checks

- `npm run lint` / `npm run lint:fix`
- `npm test` (Vitest) – uses `tests/setup-env.ts` to load `.env.test` if present

## Troubleshooting

- **Mongo connection fails** – verify `MONGO_URI`, user credentials, and network rules. The process exits when the initial connection cannot be established.
- **Question service unavailable** – readiness check will degrade. Ensure `QUESTION_SERVICE_URL` is correct and reachable; otherwise `POST /start` requests that rely on preferences will fail with `502`.
- **History snapshots missing** – set `HISTORY_SERVICE_URL` or expect a warning when the service tries to persist `finalCode`.
- **Socket namespace mismatch** – clients must connect via `/api/v1/collab-service/socket.io` with websocket transport; other paths return 404.
- **Multi-instance sync issues** – confirm Redis credentials. Logs tagged `[collab.socket][redis]` or `[collab.socket][yjs-sync]` indicate adapter/Yjs status. Run `redis-cli PUBSUB CHANNELS "socket.io*" "collab:yjs:update"` to ensure events flow.
