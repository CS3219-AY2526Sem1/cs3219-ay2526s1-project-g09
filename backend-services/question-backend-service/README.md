# Question Backend Service

Fastify (TypeScript, ESM) service that:

- Accepts POSTs from other services to upsert LeetCode question data
- Exposes endpoints for question existence checks and random question retrieval

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
docker network create peerprep_net # If not created yet
docker build --tag question-service .
docker run --rm --publish 5275:5275 --env-file .env --name question-backend --network peerprep_net question-service
```

You should see logs like:

```text
Mongo connected
Server listening on http://localhost:5275
```

## Project Structure

```text
src/
  db/
    model/
      question.ts     # Mongoose schema for Question
    types/
      question.ts     # TypeScript interface
    connection.ts     # Handles MongoDB connection setup (Mongoose Connect)
    dbLimiter.ts      # Rate limiter for database operations
  index.ts            # Tiny bootstrap: loads env, creates server, starts listening
  routes.ts           # REST endpoints
  server.ts           # buildServer(): plugins + routes
```

## API

Base URL: `http://localhost:5275/api/v1`

### Questions — existence check

**GET** `/question/exists`  
Checks whether a question with the given attributes exists.

Query params

- categoryTitle (string)
- difficulty (Easy|Medium|Hard)

Example:

```bash
# For window users
curl.exe  http://localhost:5275/api/questions/exists?categoryTitle=Algorithms&difficulty=Easy
```

### Questions — random fetch

**GET** `/question/random`  
Returns a single random question filtered by query.

Query params

- categoryTitle (string)
- difficulty (Easy|Medium|Hard)

Example:

```bash
# For window users
curl.exe http://localhost:5275/api/questions/random?categoryTitle=Algorithms&difficulty=Easy
```

### Questions — insert

**POST** `/questions/post-question`
Upserts a question document.

## Data Model

`Question` (database: `question-service`)

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
