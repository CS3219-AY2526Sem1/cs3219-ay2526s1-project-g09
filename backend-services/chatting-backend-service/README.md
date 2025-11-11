# PeerPrep - Chat Backend Service

Express.js + Socket.io service that:

- Provides real-time bidirectional chat communication via WebSocket
- Manages user presence and room state with Redis
- Supports horizontal scaling with Redis Pub/Sub adapter
- Implements graceful disconnect handling with reconnection grace period

## Tech

- Express.js
- Node.js 22
- Socket.io (WebSocket)
- Redis (Room State & Pub/Sub)
- JavaScript (ES Modules)

## Running Chat Service

**Before running** check for the following requirements:

- Node.js 18 or higher
- Redis (6379)
- npm

1. Open Command Line/Terminal and navigate into the `chatting-backend-service` directory.

2. Run the command: `npm install`. This will install all the necessary dependencies.

3. Clone `.env.example` and rename as `.env`.

4. Configure Redis connection:
   - For local Redis: Set `REDIS_HOST=localhost` and `REDIS_PORT=6379`
   - For AWS ElastiCache with TLS: Set `REDIS_TLS_ENABLED=true`

5. Run the command: `docker run -d -p 6379:6379 redis:latest`. This will start a local Redis container.

6. Run the command `npm start` to start the Chat Service in production mode, or use `npm run dev` for development mode, which includes features like automatic server restart when you make code changes.

7. The service will be available on port 5286. If you wish to change the port, please update the `.env` file.

## Running with Docker

1. Follow steps 1 to 4 from [Running Chat Service](#running-chat-service).

2. Run `docker compose up --build`.

3. The Chat Service will be available on port 5286 (or the configured PORT). WebSocket connections can be made to `ws://localhost:5286/api/v1/chat-service/socket.io`.

## Project Structure

```
src/
  server.js                   # HTTP server initialization & Socket.io setup
  app.js                      # Express app setup with middleware

  services/
    redis.service.js          # Redis connection & room management operations

  utils/
    socket.util.js            # Socket.io event handlers & room logic
```

## Service Architecture

### WebSocket Connection

- **Path:** `/api/v1/chat-service/socket.io`
- **Protocol:** WebSocket (Socket.io)
- **CORS:** Restricted to `http://localhost:5173` (development) and configured CloudFront domain (production)

### Redis Integration

The service uses Redis for two purposes:

1. **Room State Management:** Stores active users and their state in each chat room
2. **Pub/Sub Adapter:** Enables horizontal scaling by synchronizing events across multiple server instances

### Graceful Disconnect Handling

The service implements a 10-second grace period for disconnections to prevent false "user left" notifications during temporary network issues or page refreshes. Users can reconnect within this window without triggering leave events.

## WebSocket Events

### Client to Server Events

#### Join Room

- **Event:** `join_room`

- **Behaviour:** Adds a user to a chat room and notifies other participants. Handles both initial joins and reconnections.

- **Payload**

  | Name       | Type   | Required | Description                         |
  | ---------- | ------ | -------- | ----------------------------------- |
  | `userId`   | string | Yes      | Unique identifier for the user      |
  | `username` | string | Yes      | Display name for the user           |
  | `roomId`   | string | Yes      | Unique identifier for the chat room |

  ```javascript
  socket.emit("join_room", {
    userId: "user-123",
    username: "Alice",
    roomId: "session-456",
  });
  ```

- **Server Response:**
  - Emits `system_message` to room with event type `"connect"`, `"reconnect"`, or `"existing_users"`
  - Event type depends on whether user is new, returning after confirmed disconnect, or rejoining existing session

#### Send Message

- **Event:** `send_message`

- **Behaviour:** Broadcasts a message to all other users in the same room.

- **Payload**

  | Name      | Type   | Required | Description                                    |
  | --------- | ------ | -------- | ---------------------------------------------- |
  | `message` | object | Yes      | Message object containing content and metadata |

  Message object structure:

  | Name        | Type   | Required | Description                    |
  | ----------- | ------ | -------- | ------------------------------ |
  | `userId`    | string | Yes      | ID of the message sender       |
  | `username`  | string | Yes      | Username of the message sender |
  | `content`   | string | Yes      | Message text content           |
  | `timestamp` | number | Yes      | Unix timestamp (milliseconds)  |

  ```javascript
  socket.emit("send_message", {
    message: {
      userId: "user-123",
      username: "Alice",
      content: "Hello, world!",
      timestamp: Date.now(),
    },
  });
  ```

- **Server Response:**
  - Broadcasts `receive_message` event to all other users in the room (excluding sender)

#### Leave Session

- **Event:** `leave_session`

- **Behaviour:** Manually disconnects the user from the chat room and triggers immediate cleanup.

- **Payload:** None

  ```javascript
  socket.emit("leave_session");
  ```

- **Server Response:**
  - Triggers socket disconnect immediately
  - Emits `system_message` with event type `"disconnect"` after grace period

#### Disconnect

- **Event:** `disconnect` (automatic)

- **Behaviour:** Handles both intentional and unintentional disconnections with a 10-second grace period for reconnection.

- **Payload:** None (automatically triggered by Socket.io)

- **Server Response:**
  - Starts 10-second countdown before confirming user left
  - If user reconnects within grace period, cancels the disconnect notification
  - Otherwise, emits `system_message` with event type `"disconnect"` and removes user from room

### Server to Client Events

#### Receive Message

- **Event:** `receive_message`

- **Behaviour:** Delivers a message from another user in the room.

- **Payload**

  | Name        | Type   | Description                    |
  | ----------- | ------ | ------------------------------ |
  | `userId`    | string | ID of the message sender       |
  | `username`  | string | Username of the message sender |
  | `content`   | string | Message text content           |
  | `timestamp` | number | Unix timestamp (milliseconds)  |

  ```javascript
  socket.on("receive_message", (message) => {
    console.log(`${message.username}: ${message.content}`);
  });
  ```

#### System Message

- **Event:** `system_message`

- **Behaviour:** Notifies users about room events such as users joining or leaving.

- **Payload**

  | Name        | Type   | Description                                                                          |
  | ----------- | ------ | ------------------------------------------------------------------------------------ |
  | `eventType` | string | Type of system event: `"connect"`, `"reconnect"`, `"disconnect"`, `"existing_users"` |
  | `userId`    | string | ID of the user related to the event (for connect/disconnect)                         |
  | `username`  | string | Username of the user related to the event (for connect/disconnect)                   |
  | `users`     | array  | List of active users (only for `"existing_users"` event type)                        |

  Example - User Connected:

  ```javascript
  {
    eventType: 'connect',
    userId: 'user-123',
    username: 'Alice'
  }
  ```

  Example - Existing Users (sent to newly joined user):

  ```javascript
  {
    eventType: 'existing_users',
    users: [
      { userId: 'user-456', username: 'Bob' },
      { userId: 'user-789', username: 'Charlie' }
    ]
  }
  ```

  ```javascript
  socket.on("system_message", (data) => {
    if (data.eventType === "connect") {
      console.log(`${data.username} joined the room`);
    } else if (data.eventType === "disconnect") {
      console.log(`${data.username} left the room`);
    } else if (data.eventType === "existing_users") {
      console.log("Current users:", data.users);
    }
  });
  ```

## HTTP API Reference

### Health Check

- Usage: **GET** `http://localhost:5286/health`

- Behaviour: Checks if the Chat Service is running and responsive.

- Expected Response:
  - HTTP STATUS 200 OK: Service is healthy and operational.

    ```json
    {
      "status": "ok",
      "service": "chat-service"
    }
    ```

## Redis Configuration

### Environment Variables

| Variable            | Type    | Required | Default | Description                            |
| ------------------- | ------- | -------- | ------- | -------------------------------------- |
| `PORT`              | number  | No       | 5286    | Port for the HTTP/WebSocket server     |
| `REDIS_HOST`        | string  | No       | redis   | Redis server hostname                  |
| `REDIS_PORT`        | number  | No       | 6379    | Redis server port                      |
| `REDIS_TLS_ENABLED` | boolean | No       | false   | Enable TLS for Redis (AWS ElastiCache) |

### Redis Data Structure

Chat rooms are stored with the following structure:

```
Key: room:{roomId}:users
Value: {
  "userId1": {
    "username": "Alice",
    "isDisconnectConfirm": false
  },
  "userId2": {
    "username": "Bob",
    "isDisconnectConfirm": false
  }
}
```

### Failover Strategy

The service implements automatic failover:

1. **Primary:** Redis-based room storage (distributed, persistent)
2. **Fallback:** In-memory storage (single-instance, ephemeral)

If Redis is unavailable, the service automatically falls back to in-memory storage and logs a warning. This ensures the service remains operational even without Redis, though room state will not be shared across multiple instances.

## WebSocket Connection Example

### Using Socket.io Client

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:5286", {
  path: "/api/v1/chat-service/socket.io",
});

// Join a room
socket.emit("join_room", {
  userId: "user-123",
  username: "Alice",
  roomId: "session-456",
});

// Send a message
socket.emit("send_message", {
  message: {
    userId: "user-123",
    username: "Alice",
    content: "Hello!",
    timestamp: Date.now(),
  },
});

// Receive messages
socket.on("receive_message", (message) => {
  console.log(`${message.username}: ${message.content}`);
});

// Listen for system messages
socket.on("system_message", (data) => {
  console.log("System event:", data);
});

// Leave the room
socket.emit("leave_session");
```

## Key Features

### Graceful Disconnect Handling

The service implements a 10-second grace period when a user disconnects. During this time:

- The user is marked as potentially disconnecting but not removed
- If the user reconnects, no "user left" notification is sent
- If the grace period expires, a `system_message` with `eventType: "disconnect"` is broadcast
- This prevents false notifications during page refreshes or temporary network issues

### Horizontal Scaling

The service uses Redis Pub/Sub adapter to enable horizontal scaling:

- Multiple server instances can run simultaneously
- Socket.io events are synchronized via Redis Pub/Sub
- Room state is shared across all instances
- Load balancing is supported out of the box

### Room Cleanup

Rooms are automatically cleaned up when empty:

- When the last user leaves a room, the room data is deleted from Redis
- Prevents memory leaks and stale data accumulation
- No manual cleanup required
