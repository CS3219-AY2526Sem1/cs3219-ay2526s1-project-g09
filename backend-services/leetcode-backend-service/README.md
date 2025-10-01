# LeetCode Backend Service

Fastify (TypeScript, ESM) service that:

- Pings LeetCode’s GraphQL API to fetch problems and details
- Parse to readable to question service
- Run Cron Job from GitHub Actions
- Push simple information to GraphQL to Question Service when there are information being retrieved
- POST attained information to the leetcode-service for insertion
- Check if there are information in GraphQL - if there are, insert it.

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
2. Replace `<db_password>` in the `MONGODB_URI` variable with the cluster account password.

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
  index.ts            # tiny bootstrap (reads env, starts server)
  server.ts           # buildServer(): registers plugins + routes

  plugins/
    db.ts             # Mongoose connect

  models/
    Question.ts       # titleSlug, title, content (collection: leetcode_questions)

  services/
    leetcode.ts       # wrappers around gql + queries

  queries/
    leetcode.ts       # QUERY_LIST, QUERY_DETAIL

  routes/
    leetcode.ts       # GET /leetcode/test, POST /leetcode/seed-first
```

## API

Base URL: `http://localhost:5285/api/v1`

### LeetCode Test for manual testing of Graph QL endpoint

**GET** `/leetcode/test`  
Fetches details of all leetcode questions.

```bash
# For window users
curl.exe http://localhost:5285/api/v1/leetcode/test
```

### Seed first problem into Mongo

**POST** `/leetcode/seed-batch`  
Fetches the next 20 problem and **upserts** to Mongo within 2 minutes.

Query params:

- `full=1` → include large `content` field in response

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

**GET** `/questions`  
Optional route if enabled.

```bash
curl http://localhost:5275/api/v1/questions
```

## Data Model

`Question` (collection: `leetcode_questions`)

```ts
{
  // identity
  titleSlug: String,           // titleSlug, unique
  title: String,

  // meta
  difficulty: String,     // Contains either "Easy", "Medium", "Hard"
  isPaidOnly: Boolean,
  categoryTitle: String,

  // content
  content: String,        // HTML body
  codeSnippets: [{        // Array of Objects 
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

## Troubleshooting

- **`curl: (7) Failed to connect`**  
  Server isn’t running or wrong port. Start `npm run dev` and check logs.

---
