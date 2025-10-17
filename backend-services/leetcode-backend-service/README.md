# LeetCode Backend Service

Fastify (TypeScript, ESM) service that:

- Pings LeetCode’s GraphQL API to fetch problems and details
- If successful retrieval and storage in `leetcode-service` database,
  POST the question to question service (to allow retrieval by other microservices)
- Run Cron Job to sync information from LeetCode API daily

## Tech

- Fastify, @fastify/cors
- TypeScript (ESM)

## Getting Started

### 1. Requirements

- Node.js ≥ 20
- MongoDB Atlas
- npm

### 2. Clone & Install

```bash
npm install
```

### 3. Environment

1. Clone `.env.example` file and rename it as `.env`.
2. Replace `<db_password>` in the `MONGODB_URI` and `ADMIN_TOKEN` variable with the cluster account password.

### 4. Run

```bash
docker network create peerprep_net # If not created yet
docker build --tag leetcode-service .
docker run --rm --publish 5285:5285 --env-file .env  --name leetcode-backend --network peerprep_net leetcode-service
```

You should see logs like:

```text
Mongo connected
Server listening on http://localhost:5285
```

**Note**: Local development (e.g. `npm run dev`) is possible (though not recommended). To enable it, update the .env file by changing:

```bash
QUESTION_API_URL=http://question-backend:5275/api/v1/question-service
```

to:

```bash
QUESTION_API_URL=http://localhost:5275/api/v1/question-service
```

Do change the `QUESTION_API_URL` back when using docker run.

## Project Structure

```text
src/
  db/
    model/
      question.ts     # Mongoose schema definition for Question documents
    types/
      question.ts     # TypeScript interface for Question
    changeStream.ts   # Listens to changes in leetcode-service DB and triggers sync events
    connection.ts     # Handles MongoDB connection setup (Mongoose Connect)
    dbLimiter.ts      # Rate limiter for database operations
  leetcode/
    client.ts         # GraphQL client setup for communicating with LeetCode API
    queries.ts        # Contains LeetCode GraphQL queries (QUERY_LIST, QUERY_DETAIL)
    seedBatch.ts      # Resumable batch seeding using persisted cursor; upserts windowed pages
    service.ts        # wrappers around gql + queries
    types.ts          # TypeScript interface for

  index.ts            # Tiny bootstrap: loads env, creates server, starts listening
  routes.ts           # Fastify routes: GET /leetcode/test, POST /leetcode/seed-batch
  server.ts           # buildServer(): registers plugins + routes
```

## API

Base URL: `http://localhost:5285/api/v1/leetcode-service`

### Seed 200 problems into Mongo

**POST** `/seed-batch`  
Fetches the next 200 problems and **upserts** to Mongo.

Examples:

```bash
# Replace ADMIN_TOKEN with DB password
# MUSt run the question-service before running the follow command
curl.exe --request POST -H "X-Admin-Token: <ADMIN_TOKEN>" --url "http://localhost:5285/api/v1/leetcode-service/seed-batch"
```

## Data Model

`Question` (database: `leetcode-service`)

```ts
{
  titleSlug: String,
  title: String,
  difficulty: "Easy" | "Medium" | "Hard",
  categoryTitle: String,
  timeLimit: Number,
  content: String,
  codeSnippets: [{
    lang: String,
    langSlug: String,
    code: String,
  }],
  hints: [String],
  sampleTestCase: String,
  createdAt: Date,
  updatedAt: Date
}
```

---
