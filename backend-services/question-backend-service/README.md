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

Base URL: `http://localhost:5275/api/v1/question-service`

### Existence Check

**POST** `/exists-categories-difficulties`  
Checks whether a question with the given attributes exists.

Sample reply body:

```json
{
  "categories": {
    "Algorithms": ["Easy", "Medium", "Hard"],
    "CS": ["Easy"]
  }
}
```

Sample response:

```json
{
  "Algorithms": {
    "Easy": true,
    "Medium": true,
    "Hard": true
  },
  "CS": {
    "Easy": false
  }
}
```

### Fetch random question

**POST** `/random`  
Returns a single random question filtered by query.

Sample reply body:

```json
{
  "categories": {
    "Algorithms": ["Easy", "Medium", "Hard"],
    "Database": ["Easy"]
  }
}
```

Sample response:

```json
{
  "_id": "68ebac53b63b10de074be992",
  "globalSlug": "leetcode:rearrange-products-table",
  "__v": 0,
  "categoryTitle": "Database",
  "codeSnippets": [
    {
      "lang": "MySQL",
      "langSlug": "mysql",
      "code": "# Write your MySQL query statement below\n"
    }
  ],
  "content": "<p>Table: <code>Products</code></p>\n....",
  "createdAt": "2025-10-12T13:25:40.139Z",
  "difficulty": "Easy",
  "exampleTestcases": "{\"headers\":{\"Products\":[\"product_id\",\"store1\",\"store2\",\"store3\"]},\"rows\":{\"Products\":[[0, 95, 100, 105], [1, 70, null, 80]]}}",
  "hints": [],
  "source": "leetcode",
  "timeLimit": 30,
  "title": "Rearrange Products Table",
  "titleSlug": "rearrange-products-table",
  "updatedAt": "2025-10-12T13:25:40.139Z"
}
```

### Insert Question into Database

**POST** `/question`
Upserts a question document.

---
