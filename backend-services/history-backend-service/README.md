# PeerPrep - History Backend Service

Node.js/Express service that:

- Persists the final state of each collaboration session per `(sessionId, userId)` pair
- Exposes REST APIs for listing, retrieving, and mutating saved attempts

## Tech

- Node.js 18+
- Express 5
- Mongoose 8
- MongoDB
- Vitest + Supertest

## Running History Service

**Before running** check for the following requirements:

- Node.js 18 or higher
- npm
- MongoDB instance (local or Atlas)
- Docker (optional, useful for spinning up Mongo locally)

1. Open a terminal and navigate to `backend-services/history-backend-service`.
2. Install dependencies: `npm install`.
3. Start MongoDB (example: `docker run -d -p 27017:27017 --name history-mongo mongo:7`).
4. Copy `.env.example` to `.env`.
5. Fill in the environment variables:
   - `MONGO_URI=<your_mongo_connection_string>`
   - `MONGO_DB_NAME=<database_name>` (defaults to `history-service`)
   - `PORT=<http_port>` (defaults to `5278`)
6. Run `npm run dev` for a watch-mode server or `npm start` for a production-style process.

The service listens on `http://localhost:5278/api/v1/history-service` unless you override `PORT`.

## Running with Docker

1. Follow steps 1–5 from [Running History Service](#running-history-service).
2. Build and start the container: `docker compose up --build`.
3. Interact with the API on port `5278` (mapped from the container). Update `.env` if you need a different port.

## Project Structure

```
src/
  app.js                           # Express app wiring (middleware, routes, error handling)
  server.js                        # Entrypoint that boots Mongo and the HTTP server
  config/
    db.js                          # Mongo connection helper (dotenv + retry logic)
  controllers/
    history.controller.js          # Request validation and response formatting
  routes/
    history.routes.js              # Defines /api/v1/history-service endpoints
  services/
    history.service.js             # Business rules, sanitisation, Mongo queries
  models/
    historyEntry.model.js          # Mongoose schema + indexes for session_history
tests/
  history.controller.test.js       # Controller-level Vitest specs
  history.routes.test.js           # Supertest coverage of HTTP endpoints
  history.service.test.js          # Unit tests for the service layer
Dockerfile
vitest.config.ts
```

## API Overview

Base URL: `http://localhost:5278/api/v1/history-service`

## API Reference

### Get the service status

- Usage: **GET** `http://localhost:5278/api/v1/history-service/health`
- Behaviour: Returns uptime information so probes can verify the service is alive.
- Expected Response:
  - HTTP STATUS 200 OK: Service is up.

    ```json
    {
      "status": "ok",
      "uptime": 359.2191,
      "timestamp": "2024-11-06T01:50:22.123Z"
    }
    ```

  - HTTP STATUS 500 INTERNAL SERVER ERROR: Unexpected failure.

    ```json
    {
      "status": "error",
      "message": "Failed to reach Mongo",
      "timestamp": "2024-11-06T01:50:22.123Z"
    }
    ```

### List snapshots

- Usage: **GET** `http://localhost:5278/api/v1/history-service/history`
- Behaviour: Returns paginated snapshots sorted by `sessionEndedAt` (desc) then `createdAt` (desc).
- Query Parameters

  | Name         | Type     | Required | Description                         |
  | ------------ | -------- | -------- | ----------------------------------- |
  | `userId`     | `string` | No       | Filter by owner of the snapshot.    |
  | `sessionId`  | `string` | No       | Filter by collaboration session ID. |
  | `questionId` | `string` | No       | Filter by `question.questionId`.    |
  | `limit`      | `number` | No       | Defaults to `20`, maximum `100`.    |
  | `skip`       | `number` | No       | Defaults to `0`.                    |

- Expected Response:
  - HTTP STATUS 200 OK:

    ```json
    {
      "success": true,
      "items": [
        {
          "_id": "6757baf6f4f1aebc7dce1092",
          "sessionId": "sess-123",
          "userId": "u123",
          "participants": ["u123", "u456"],
          "question": {
            "questionId": "two-sum",
            "title": "Two Sum",
            "difficulty": "Easy",
            "topics": ["Arrays"]
          },
          "language": "javascript",
          "code": "// final code ...",
          "sessionEndedAt": "2024-11-06T01:43:10.212Z",
          "createdAt": "2024-11-06T01:43:10.212Z",
          "updatedAt": "2024-11-06T01:43:10.212Z"
        }
      ],
      "total": 6,
      "limit": 10,
      "skip": 0
    }
    ```

  - HTTP STATUS 500 INTERNAL SERVER ERROR:

    ```json
    {
      "success": false,
      "error": "Failed to retrieve history snapshots"
    }
    ```

### Get a snapshot

- Usage: **GET** `http://localhost:5278/api/v1/history-service/history/{id}`
- Behaviour: Fetches a single snapshot by Mongo `_id`.
- Parameters

  | Name | Type     | Required | Description               |
  | ---- | -------- | -------- | ------------------------- |
  | `id` | `string` | Yes      | Mongo ObjectId of record. |

- Expected Response:
  - HTTP STATUS 200 OK:

    ```json
    {
      "success": true,
      "snapshot": {
        "_id": "6757baf6f4f1aebc7dce1092",
        "sessionId": "sess-123",
        "userId": "u123",
        "question": { "...": "..." },
        "code": "// final code ..."
      }
    }
    ```

  - HTTP STATUS 404 NOT FOUND:

    ```json
    {
      "success": false,
      "error": "History snapshot not found"
    }
    ```

  - HTTP STATUS 400 BAD REQUEST: Missing `id` parameter.

### Create or Update Snapshot

- Usage: **POST** `http://localhost:5278/api/v1/history-service/history`
- Behaviour: Upserts a snapshot identified by `(sessionId, userId)` and returns the stored document.
- Body

  | Name               | Type            | Required | Description                                                               |
  | ------------------ | --------------- | -------- | ------------------------------------------------------------------------- |
  | `sessionId`        | `string`        | Yes      | Collaboration session ID; trimmed.                                        |
  | `userId`           | `string`        | Yes      | Owner of the snapshot; auto-added to `participants` if missing.           |
  | `code`             | `string`        | Yes\*    | Final code; alternatively provide `codeSnapshot` (service will use that). |
  | `question`         | `object`        | Yes      | Must include at least `questionId`; title/difficulty/topics are optional. |
  | `participants`     | `array<string>` | No       | Deduplicated list of participant IDs.                                     |
  | `language`         | `string`        | No       | Stored lower-case; defaults to `javascript`.                              |
  | `sessionStartedAt` | `string` (ISO)  | No       | Optional start timestamp.                                                 |
  | `sessionEndedAt`   | `string` (ISO)  | No       | Optional end timestamp, used for sorting.                                 |
  | `durationMs`       | `number`        | No       | Non-negative duration (ms).                                               |
  | `metadata`         | `object`        | No       | Free-form JSON blob for downstream consumers.                             |

- Expected Response:
  - HTTP STATUS 201 CREATED:

    ```json
    {
      "success": true,
      "snapshot": {
        "_id": "6757baf6f4f1aebc7dce1092",
        "sessionId": "sess-123",
        "userId": "u123",
        "participants": ["u123", "u456"],
        "language": "javascript",
        "question": { "...": "..." },
        "code": "// final code ..."
      }
    }
    ```

  - HTTP STATUS 400 BAD REQUEST: Validation failed (missing required fields, invalid timestamps, etc.).

### Update Snapshot

- Usage: **PATCH** `http://localhost:5278/api/v1/history-service/history/{id}`
- Behaviour: Applies partial updates to an existing snapshot.
- Parameters

  | Name | Type     | Required | Description               |
  | ---- | -------- | -------- | ------------------------- |
  | `id` | `string` | Yes      | Mongo ObjectId of record. |

- Body (at least one field must be supplied)

  | Name               | Type     | Description                                        |
  | ------------------ | -------- | -------------------------------------------------- | ------------------------------------- |
  | `code`             | `string` | Replaces stored code (trimmed, must be non-empty). |
  | `language`         | `string` | Persisted lower-case.                              |
  | `sessionStartedAt` | `string  | null`                                              | ISO timestamp or `null` to unset.     |
  | `sessionEndedAt`   | `string  | null`                                              | ISO timestamp or `null` to unset.     |
  | `durationMs`       | `number` | Non-negative duration.                             |
  | `metadata`         | `object  | null`                                              | Free-form JSON; send `null` to clear. |

- Expected Response:
  - HTTP STATUS 200 OK:

    ```json
    {
      "success": true,
      "snapshot": {
        "_id": "6757baf6f4f1aebc7dce1092",
        "code": "// updated code ...",
        "language": "typescript"
      }
    }
    ```

  - HTTP STATUS 400 BAD REQUEST: Missing `id` or invalid patch body.
  - HTTP STATUS 404 NOT FOUND: Snapshot does not exist.
  - HTTP STATUS 500 INTERNAL SERVER ERROR: Unexpected failure when updating.
