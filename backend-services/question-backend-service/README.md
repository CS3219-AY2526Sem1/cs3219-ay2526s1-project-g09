# Question Backend Service

Fastify (TypeScript, ESM) service that:
- Pings LeetCode’s GraphQL API to fetch problems and details
- Seeds the all problem into MongoDB Atlas (Currently WIP)
- Exposes simple health and query endpoints

## Tech
- Fastify, @fastify/cors  
- Mongoose (MongoDB)  
- TypeScript (ESM)  

## Getting Started

### 1) Requirements
- Node.js ≥ 20
- MongoDB Atlas (or local MongoDB)
- npm

### 2) Clone & Install
```bash
npm install
```

### 3) Environment
1. Clone `.env.example` file and rename it as `.env`. 
2. Replace `<db_password>` in the `MONGODB_URI` variable with the cluster account password. 

### 4) Run

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
```
Mongo connected
Server listening on http://localhost:5275
```

## Project Structure

```
src/
  index.ts            # tiny bootstrap (reads env, starts server)
  server.ts           # buildServer(): registers plugins + routes

  plugins/
    db.ts             # Mongoose connect

  models/
    Question.ts       # slug, title, content (collection: leetcode_questions)

  services/
    leetcode.ts       # wrappers around gql + queries

  queries/
    leetcode.ts       # QUERY_LIST, QUERY_DETAIL

  routes/
    health.ts         # GET /api/v1/healthz
    leetcode.ts       # GET /leetcode-test, POST /leetcode/seed-first
```

## API

Base URL: `http://localhost:5275/api/v1`

### Health
**GET** `/healthz`  
Returns `{ ok: true, service: "question-backend-service" }`

### LeetCode Test for manual testing of Graph QL endpoint
**GET** `/leetcode-test`  
Fetches first page (limit=5) and details of the first problem.
```bash
curl http://localhost:5275/api/v1/leetcode-test
```

### Seed first problem into Mongo
**POST** `/leetcode/seed-first`  
Fetches the first problem (title & HTML content) and **upserts** to Mongo.

Query params:
- `full=1` → include large `content` field in response

Examples:
```bash
# With jq
curl --silent --request POST --url "http://localhost:5275/api/v1/leetcode/seed-first?full=1" | jq .
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

`Question` (collection: `leetcode_questions`) - will further expand when need
```ts
{
  slug: string,      // unique
  title: string,
  content: string,   // HTML from LeetCode
  createdAt: Date,   // via timestamps: true
  updatedAt: Date
}
```

## Troubleshooting

- **`curl: (7) Failed to connect`**  
  Server isn’t running or wrong port. Start `npm run dev` and check logs.


## Security

- **Never commit `.env`** (ensure it’s in `.gitignore`).  
- Rotate leaked credentials immediately.  
- Use least-privilege DB users per environment.

---
