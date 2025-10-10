# Question Backend Service

Fastify (TypeScript, ESM) service that:

- Post request for inserting questions from other microservices
- Provide API endpoints for question status and random question generation

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
docker build --tag question-service .
docker run --rm --publish 5275:5275 --env-file .env question-service
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
      question.ts     # Mongoose schema definition for Question documents
    types/
      question.ts     # TypeScript interface for Question
    connection.ts     # Handles MongoDB connection setup (Mongoose Connect)
    dbLimiter.ts      # Rate limiter for database operations  
  index.ts            # Tiny bootstrap: loads env, creates server, starts listening
  routes.ts           # Fastify routes: GET /questions/exists, GET /questions/random, POST /questions/post-question
  server.ts           # buildServer(): registers plugins + routes
```

## API

Base URL: `http://localhost:5275/api/v1`

### Calls required by other microservices

**GET** `/question/exists`  
Given the parameter, check if there exist a corresponding question with the same attribute.

```bash
# For window users
curl.exe  http://localhost:5275/api/questions/exists?categoryTitle=Algorithms&difficulty=Easy
```

**GET** `/question/random`  
Fetch a random question based on the category Title and Difficulty level provided. 

```bash
# For window users
curl.exe http://localhost:5275/api/questions/random?categoryTitle=Algorithms&difficulty=Easy
```

Response (fields):

- `upserted` — true if inserted new
- `modified` — true if updated existing
- `doc` — the stored document (by default without `content` unless `full=1`)

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
