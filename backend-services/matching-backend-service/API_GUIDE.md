# Matching Service

The Matching Service is a microservice responsible for pairing users based on their preferences.  
It supports submitting match requests, canceling them, and receiving match results in real-time via pub/sub notifications.

---

## Features

- Submit a match request with user preferences.
- Cancel a pending request.
- Receive match results when a compatible partner is found.
- Automatic timeout if no match is found within a configurable duration.
- Redis pub/sub integration for real-time notifications.
- MongoDB persistence for user preferences.

---

## Prerequisites

- [Redis Image 8.2.1](https://hub.docker.com/_/redis)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

---

## Running Locally

```bash
docker compose up --build
```

This will start:

- `redis` (caching + pub/sub)
- `matching-service` (instance)

Service will be available at:

- `http://localhost:5274`

---

## API Endpoints

### 1. Submit a Match Request

`POST /api/v1/matching-service/matches`

**Request body:**

```json
{
  "userId": "user123",
  "topics": ["Database"],
  "difficulties": ["Medium"],
  "minTime": "100",
  "maxTime": "200"
}
```

**Response (canceled/overriden):**

HTTP Response: 410 Gone

```json
Match request was cancelled
```

**Response (matched):**

HTTP Status: 200 OK

```json
{
  "userId": "user456",
  "topics": ["Database"],
  "difficulties": ["Medium"],
  "minTime": 100,
  "maxTime": 200
}
```

**Response (timeout):**
HTTP Status:

202 Accepted

```json
No match found (timeout)
```

---

### 2. Cancel a Match Request

`DELETE /api/v1/matching-service/matches/{userId}`
HTTP Status: 204 No Content
**Response:**

```json

```

---

### 3. Get User Preference (for loading preferences)

`GET /api/v1/matching-service/preferences/{userId}`

**Response:**
HTTP Status: 200 OK

```json
{
  "userId": "user123",
  "topics": ["Easy"],
  "difficulties": ["Medium"],
  "minTime": 100,
  "maxTime": 200
}
```

### 4. Delete User Preference

`DELETE /api/v1/matching-service/preferences/{userId}`

**Response:**
HTTP Status: 204 No Content

### 5. Create/Update User Preference

`PUT /api/v1/matching-service/preferences`

**Request Body:**

```json
{
  "userId": "user123",
  "topics": ["Easy"],
  "difficulties": ["Medium"],
  "minTime": 100,
  "maxTime": 200
}
```

**Response:**
HTTP Status: 200 OK

---

## Error Handling

All errors return structured JSON with HTTP status codes. They are logged internally

Example:

```json
{
  "error": "UserPreferenceNotFoundException",
  "message": "No preferences found for userId=user999",
  "location": "MatchingController.java:42"
}
```

---

## Architecture Notes

- **Redis**: Used for pub/sub events (`match-notification`, `cancel-notification`) and sharing data between microservice instances.
- **MongoDB**: Stores persistent user preferences.
- **Horizontal Scaling**: Multiple instances of the service (e.g., `matching-service-1`, `matching-service-2`) can subscribe to the same Redis channels.

---

## Configuration

Environment variables:

- `REDIS_HOST` → Redis hostname.
- `REDIS_PORT` → Redis port.
- `MONGODB_URI` → MongoDB connection string.

---

## Example Flow

1. `user123` sends a match request.
2. `user456` sends a match request.
3. Service matches them → both futures complete → response returned.
4. If `user123` cancels before matching, a cancel-notification is published and the request is cleared.
