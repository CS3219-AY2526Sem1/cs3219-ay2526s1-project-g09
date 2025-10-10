# LeetCode Backend Service

Fastify (TypeScript, ESM) service that:

- Pings LeetCode’s GraphQL API to fetch problems and details
- If successful retrieval and storage in `leetcode-service` database,
  POST the question to question service (to allow retrieval by other microservices)
- Run Cron Job from GitHub Actions

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
npm run dev
```

OR

```bash
npm run build
npm start
```

OR

```bash
docker build --tag leetcode-service .
docker run --rm --publish 5285:5285 --env-file .env leetcode-service
```

You should see logs like:

```text
Mongo connected
Server listening on http://localhost:5285
```

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

Base URL: `http://localhost:5285/api/v1`

### LeetCode Test for manual testing of Graph QL endpoint

**GET** `/leetcode/test`  
Fetches titleSlug of all leetcode questions and question detail of the first leetcode question.

```bash
# For window users
curl.exe http://localhost:5285/api/v1/leetcode/test
```

### Seed first 200 problems into Mongo

**POST** `/leetcode/seed-batch`  
Fetches the next 200 problems and **upserts** to Mongo within 2 minutes.

Examples:

```bash
# For window users
curl.exe --request POST -H "X-Admin-Token: <ADMIN_TOKEN>" --url "http://localhost:5285/api/v1/leetcode/seed-batch"
```

Response (fields):

- `upserted` — true if inserted new
- `modified` — true if updated existing
- `doc` — the stored document (by default without `content` unless `full=1`)

### (Optional) List saved questions

**GET** `/test`  
Optional route if enabled.

```bash
curl http://localhost:5275/api/v1/leetcode/test
```

## Data Model

`Question` (collection: `leetcode_questions`)

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
