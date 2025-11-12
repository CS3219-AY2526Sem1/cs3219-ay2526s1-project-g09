# PeerPrep - Leetcode Backend Service

Typescript service that:

- Fetches LeetCode problems via `leetcode-query` npm dependency.
- Insert questions into the LeetCode and Question Service (MongoDB)

## Tech

- TypeScript, Node.js
- Bottleneck (rate limiting)
- MongoDB (Atlas)

## Running LeetCode Service

**Before running** check for the following requirements:

- MongoDB Atlas
- Docker

1. Open Command Line/Terminal and navigate into the `leetcode-backend-service` directory.

2. Run the command: `npm install`. This will install all the necessary dependencies.

3. Clone `.env.example` and rename it as `.env`.

4. Replace `<db_password>` in the `MONGODB_URI` and `ADMIN_TOKEN` variable with your MongoDB Atlas account password.

5. Run the command `npm run dev` to start the LeetCode Service.

6. Using applications like Postman, you can interact with the Leetcode Service on port 5285.

## Running with Docker

1. Follow steps 1 to 4 from [Running LeetCode Service](#running-leetcode-service).

2. Run `docker compose up --build`.

3. Using applications like Postman, you can interact with the Leetcode Service on port 5285.

## Project Structure

```
src/
  db/
    model/
      question.ts     # Mongoose schema definition for Question documents
    types/
      question.ts     # TypeScript interface for Question
      seedBatchResponse 
    changeStream.ts   # Listens to changes in leetcode-service DB and triggers sync events
    connection.ts     # Handles MongoDB connection setup (Mongoose Connect)
    dbLimiter.ts      # Rate limiter for database operations
  leetcode/
    queries.ts        # Contains LeetCode GraphQL queries (QUERY_LIST, QUERY_DETAIL)
    seedBatch.ts      # Resumable batch seeding using persisted cursor; upserts windowed pages
    types.ts          # TypeScript interface for
  index.ts            # Tiny bootstrap: loads env, creates server, starts listening
  routes.ts           # Fastify routes: GET /leetcode/test, POST /leetcode/seed-batch
  server.ts           # buildServer(): registers plugins + routes
  health.ts
  logger.ts         # Logger file for consistent log formatting
```

## API Overview

Base URL: `http://localhost:5285/api/v1/leetcode-service`

### Get the service status

- Usage: **GET** `http://localhost:5285/api/v1/leetcode-service/health`

- Behaviour: Checks if the service is currently up.

- Expected Response:

  - HTTP STATUS 200 OK: [ADD EXPLANATION HERE]
  ```json
  {
      "ok": true
   }
  ```

### Seed LeetCode Questions to DB

- Usage: **POST** `http://localhost:5285/api/v1/leetcode-service/seed-batch`

- Behaviour: Fetches up to 200 problems from LeetCode and **upserts** to MongoDB.

- Expected Response:

  - HTTP STATUS 200 OK:
    The LeetCode questions were successfully inserted into the database. This response also includes metadata about the synchronization progress. 

  ```json
  {
    "ok": true,
    "inserted": 157,
    "modified": 0,
    "matched": 0,
    "fetched": 157,
    "pageSize": 200,
    "nextSkip": 2000,
    "total": 3730
  }
  ```

## Miscellaneous

The `/seed-batch` API fetches LeetCode questions and inserts them into the **LeetCode Service** database.
A **MongoDB Change Stream watcher** then listens for new insertions in this collection.
When a new question is detected, the watcher automatically triggers the **Question Service’s** `/add-question` API to replicate the data into the **Question Service** database.

This ensures that:

- Newly fetched LeetCode questions are propagated in real time to the Question Service.
- Other services can query the centralized Question Service database without needing to directly depend on the LeetCode Service.
