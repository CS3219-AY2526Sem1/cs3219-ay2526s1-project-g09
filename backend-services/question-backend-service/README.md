# PeerPrep - Question Backend Service

Typescript service that:

- Provides Create Operations for adding questions from the LeetCode Service or other services
- Provides CRUD operations for questions for Admin users.
- Get the categories and corresponding difficulties with questions
- Get a random question based on a set of categories and difficulties.

## Tech

- TypeScript (ESM), Node.js
- Bottleneck (rate limiting)
- Fastify, @fastify/cors
- MongoDB (Atlas)

## Running Question Service

**Before running** check for the following requirements:

- MongoDB Atlas
- Docker

1. Open Command Line/Terminal and navigate into the `question-backend-service` directory.

2. Run the command: `npm install`. This will install all the necessary dependencies.

3. Clone `.env.example` and rename it as `.env`.

4. Replace `<db_password>` in the `MONGODB_URI` and `ADMIN_TOKEN` variable with your MongoDB Atlas account password.

5. Run the command `npm run dev` to start the Question Service.

6. Using applications like Postman, you can interact with the Question Service on port 5275.

## Running with Docker

1. Follow steps 1 to 4 from [Running Question Service](#running-question-service).

2. Run `docker compose up --build`.

3. Using applications like Postman, you can interact with the Question Service on port 5275.

## Project Structure

```
src/
  db/
    model/
      question.ts     # Mongoose schema for Question
    types/
      question.ts     # TypeScript interface
    connection.ts     # Handles MongoDB connection setup (Mongoose Connect)
    dbLimiter.ts      # Rate limiter for database operations
  index.ts            # Tiny bootstrap: loads env, creates server, starts listening
  logger.ts           # Centralise formatter for logging
  routes.ts           # REST endpoints
  server.ts           # buildServer(): plugins + routes
```

## API Overview

Base URL: `http://localhost:5275/api/v1/question-service`

### Get the service status

- Usage: **GET** `http://localhost:5275/api/v1/question-service/health`

- Behaviour: Checks if the service is currently up.

- Expected Response:

  - HTTP STATUS 200 OK: The service is up.

  ```json
  {
      "ok": true
   }
  ```

---

### Get All Questions

- Usage: **GET** `http://localhost:5275/api/v1/question-service/questions`

- Behaviour: Fetch a paginated list of question previews. Supports filtering, sorting, and pagination.

- Parameters

  | Name | Type | Required | Description |
  | ------------ | ------ | -------- | --------------------------------------------------------------------------- |
  | `title` | string | No | Filter by question title |
  | `category` | string | No | Filter by category |
  | `difficulty` | string | No | Filter by difficulty |
  | `minTime` | number | No | Minimum time limit |
  | `maxTime` | number | No | Maximum time limit |
  | `size` | number | No | Number of questions per page (default 10) |
  | `page` | number | No | Page number (default 1) |
  | `sortBy` | string | No | Sort order: `newest`, `oldest`, `easiest`, `hardest`, `shortest`, `longest` |

- Expected Response:
  - HTTP STATUS 200 OK:
    The questions are retrieved succesfully.

    ```json
    {
      "page": 1,
      "size": 10,
      "total": 1618,
      "questions": [
        {
          "questionId": "6903254d32607f3570f00ad4",
          "questionName": "Two Sum",
          "topic": "Algorithms",
          "difficulty": "Easy",
          "timeLimit": "60"
        }
      ]
    }
    ```

  - HTTP STATUS 400 BAD REQUEST:
    The query params are invalid

    ```json
    {
      "error": "Invalid query params",
      "details": [
        {
          "code": "invalid_value",
          "values": [
            "Easy",
            "Medium",
            "Hard"
          ],
          "path": [
            "difficulty"
          ],
          "message": "Invalid option: expected one of \"Easy\"|\"Medium\"|\"Hard\""
        }
      ]
    }
    ```

  - HTTP STATUS 500 INTERNAL SERVER ERROR:
    An unexpected error has occurred in the service.

    ```json
    {
      "error": "Internal Server Error"
    }
    ```

---

### Get Question by ID

- Usage: **GET** `http://localhost:5275/api/v1/question-service/questions/{id}`

- Behaviour: Fetch detailed information for a single question.

- Parameters

  | Name | Type | Required | Description |
  | -------- | -------- | -------- | --------------------------------------------------------- |
  | `id` | `string` | Yes | The ID of the question to fetch. |

- Expected Response:

  - HTTP STATUS 200 OK:
    The question details are retrieved succesfully.

    ```json
    {
      "questionId": "6900f9c0894e062dcf5d3714",
      "title": "Verifying an Alien Dictionary",
      "categoryTitle": "Algorithms",
      "difficulty": "Easy",
      "timeLimit": 30,
      "content": "<p>In an alien language...</p>",
      "hints": null,
      "exampleTestcases": "",
      "codeSnippets": [],
      "answer": "",
      "createdAt": "2025-10-28T17:13:36.388Z",
      "updatedAt": "2025-10-28T17:13:36.388Z"
    }
    ```

  - HTTP STATUS 400 BAD REQUEST:
    The question ID is invalid.

    ```json
    {
      "error": "Invalid question ID"
    }
    ```

  - HTTP STATUS 404 NOT FOUND:
    The question is not found.

    ```json
    {
      "error": "Question not found"
    }
    ```

  - HTTP STATUS 500 INTERNAL SERVER ERROR:
    An unexpected error has occurred in the service.

    ```json
    {
      "error": "Internal Server Error"
    }
    ```

---

### Add a New Question

- Usage: **POST** `http://localhost:5275/api/v1/question-service/add-question`

- Behaviour: Fetch detailed information for a single question.

- Headers:

  - `x-admin-token`: must match the `ADMIN_TOKEN` in `.env`
  - `x-source`: `"admin"` or `"leetcode"`

- Body

  | Name | Type | Required | Description |
  | --------------- | -------- | -------- | --------------------------------------------------------------------------- |
  | `title` | `string` | Yes | The title of the question. |
  | `categoryTitle` | `string` | Yes | The category or topic the question belongs to. |
  | `difficulty` | `string` | Yes | The difficulty level of the question (e.g., Easy, Medium, Hard). |
  | `timeLimit` | `number` | Yes | The time limit (in minutes) allowed to solve the question. |
  | `content` | `string` | Yes | The main problem statement or description. |
  | `hints` | `array` | No | A list of hints to help the user approach the question. |
  | `answer` | `string` | No | The model or reference answer to the question. |
  | `codeSnippets` | `array` | No | Code examples in different languages, each containing `lang`, `langSlug`, and `code`. |

  ```json
  {
    "title": "Two Sum",
    "categoryTitle": "Algorithms",
    "difficulty": "Easy",
    "timeLimit": 30,
    "content": "Given an array of integers...",
    "hints": ["Use hash map"],
    "answer": "O(n) solution",
    "codeSnippets": [
      { "lang": "Python", "langSlug": "python", "code": "class Solution:" }
    ]
  }
  ```

- Expected Response:
  - HTTP STATUS 200 OK:
    The question details are added succesfully.

    ```json
    {
      "ok": true,
      "id": "6734e0a0894e062dcf5d3721",
      "message": "Question created successfully"
    }
    ```

  - HTTP STATUS 400 BAD REQUEST:
    The body is malformed, or required headers are missing/invalid.

    ```json
    {
      "error": "Invalid input",
      "details": [
        {
          "expected": "object",
          "code": "invalid_type",
          "path": [],
          "message": "Invalid input: expected object, received undefined"
        }
      ]
    }
    ```

  - HTTP STATUS 401 UNAUTHORIZED:
    Unauthorized access, due to missing or incorrect `x-admin-token` header value.

    ```json
    {
      "error": "Unauthorized"
    }
    ```

  - HTTP STATUS 409 CONFLICT:
    A question with the same title already exists.

    ```json
    {
      "ok": false,
      "message": "A question with this title already exists",
      "existingId": "6900f8d8894e062dcf5d2ece"
    }
    ```

  - HTTP STATUS 500 INTERNAL SERVER ERROR:
    An unexpected error has occurred in the service.

    ```json
    {
      "error": "Internal Server Error"
    }
    ```

---

### Update Question

- Usage: **PUT** `http://localhost:5275/api/v1/question-service/questions/{id}`

- Behaviour: Update an existing question by ID.

- Headers:

  - `x-admin-token`: must match the `ADMIN_TOKEN` in `.env`

- Body

  | Name | Type | Required | Description |
  | --------------- | -------- | -------- | --------------------------------------------------------------------------- |
  | `title` | `string` | No | The title of the question. |
  | `categoryTitle` | `string` | No | The category or topic the question belongs to. |
  | `difficulty` | `string` | No | The difficulty level of the question (e.g., Easy, Medium, Hard). |
  | `timeLimit` | `number` | No | The time limit (in minutes) allowed to solve the question. |
  | `content` | `string` | No | The main problem statement or description. |
  | `hints` | `array` | No | A list of hints to help the user approach the question. |
  | `answer` | `string` | No | The model or reference answer to the question. |
  | `codeSnippets` | `array` | No | Code examples in different languages, each containing `lang`, `langSlug`, and `code`. |

  Note: Any subset of fields allowed, but at least one attribute is required.

  ```json
  {
    "title": "Linked list",
    "difficulty": "Easy"
  }
  ```

- Expected Response:
  - HTTP STATUS 200 OK:
    The question details are updated succesfully.

    ```json
    {
      "ok": true,
      "message": "Question updated successfully",
      "questionId": "69134a384d6684a69ec056fd",
      "title": "Linked list",
      "titleSlug": "linked-list",
      "globalSlug": "linked-list"
    }
    ```

  - HTTP STATUS 400 BAD REQUEST:
    The body is malformed, or required headers are missing/invalid.

    ```json
    {
      "error": "Invalid input",
      "details": [
        {
          "expected": "object",
          "code": "invalid_type",
          "path": [],
          "message": "Invalid input: expected object, received undefined"
        }
      ]
    }
    ```

  - HTTP STATUS 401 UNAUTHORIZED:
    Unauthorized access, due to missing or incorrect `x-admin-token` header value.

    ```json
    {
      "error": "Unauthorized"
    }
    ```

  - HTTP STATUS 404 NOT FOUND:
    The question is not found.

    ```json
    {
      "error": "Question not found"
    }
    ```

  - HTTP STATUS 500 INTERNAL SERVER ERROR:
    An unexpected error has occurred in the service.

    ```json
    {
      "error": "Internal Server Error"
    }
    ```

---

### Delete Question

- Usage: **DELETE** `http://localhost:5275/api/v1/question-service/questions/{id}`

- Behaviour: Deletes a question by ID.

- Headers:

  - `x-admin-token`: must match the `ADMIN_TOKEN` in `.env`

- Expected Response:
  - HTTP STATUS 200 OK:
    The question details are deleted succesfully.

    ```json
    {
      "ok": true,
      "message": "Question deleted successfully",
      "deletedId": "6734e0a0894e062dcf5d3721",
      "title": "Two Sum"
    }
    ```

  - HTTP STATUS 400 BAD REQUEST:
    The question ID is invalid.

    ```json
    {
      "error": "Invalid input",
      "details": [
        {
          "expected": "object",
          "code": "invalid_type",
          "path": [],
          "message": "Invalid input: expected object, received undefined"
        }
      ]
    }
    ```

  - HTTP STATUS 401 UNAUTHORIZED:
    Unauthorized access, due to missing or incorrect `x-admin-token` header value.

    ```json
    {
      "error": "Unauthorized"
    }
    ```

  - HTTP STATUS 404 NOT FOUND:
    The question is not found.

    ```json
    {
      "error": "Question not found"
    }
    ```

  - HTTP STATUS 500 INTERNAL SERVER ERROR:
    An unexpected error has occurred in the service.

    ```json
    {
      "error": "Internal Server Error"
    }
    ```

---

### Get Random Question

- Usage: **POST** `http://localhost:5275/api/v1/question-service/random`

- Behaviour: Fetches a random question given categories and difficulties.

- Body

  ```json
  {
    "categories": {
      "Algorithms": ["Easy", "Hard"],
      "Database": ["Easy"]
    }
  }
  ```

- Expected Response:
  - HTTP STATUS 200 OK:
    A random question is successfully fetched.

    ```json
    {
      "_id": "6900fa61894e062dcf5d39c3",
      "source": "leetcode",
      "globalSlug": "leetcode:greatest-common-divisor-of-strings",
      "titleSlug": "greatest-common-divisor-of-strings",
      "title": "Greatest Common Divisor of Strings",
      "difficulty": "Easy",
      "categoryTitle": "Algorithms",
      "timeLimit": 30,
      "content": "<p>For two strings <code>s</code> and <code>t</code>, ...",
      "exampleTestcases": "\"ABCABC\"\n\"ABC\"\n\"ABABAB\"\n\"ABAB\"\n\"LEET\"\n\"CODE\"",
      "codeSnippets": [
        {
          "lang": "C++",
          "langSlug": "cpp",
          "code": "class Solution {\npublic:\n    string gcdOfStrings(string str1, string str2) {\n        \n    }\n};"
        },
        ...
      ],
      "hints": [
        "The greatest common divisor must be a prefix of each string, so we can try all prefixes."
      ],
      "answer": "",
      "createdAt": "2025-10-28T17:16:17.772Z",
      "updatedAt": "2025-10-28T17:16:17.772Z",
      "__v": 0
    }
    ```

  - HTTP STATUS 400 BAD REQUEST:
    The body is malformed or there is missing data.

    ```json
    {
      "error": "Invalid input",
      "details": [
        {
          "expected": "object",
          "code": "invalid_type",
          "path": [],
          "message": "Invalid input: expected object, received undefined"
        }
      ]
    }
    ```

  - HTTP STATUS 404 NOT FOUND:
    There is no question found.

    ```json
    {
      "error": "Question not found"
    }
    ```

  - HTTP STATUS 500 INTERNAL SERVER ERROR:
    An unexpected error has occurred in the service.

    ```json
    {
      "error": "Internal Server Error"
    }
    ```

    OR

    ```json
    {
      "statusCode": 500,
      "error": "Internal Server Error",
      "message": "Cannot destructure property 'categories' of 'req.body' as it is undefined."
    }
    ```

---

### Get All Categories

- Usage: **GET** `http://localhost:5275/api/v1/question-service/questions/categories`

- Behaviour: Returns all distinct categories.

- Expected Response:
  - HTTP STATUS 200 OK:
    An array of categories is successfully fetched.

    ```json
    {
      "categories": [
        "Concurrency",
        "Database",
        "Algorithms",
        "JavaScript",
        "pandas",
        "Shell"
      ]
    }
    ```

  - HTTP STATUS 500 INTERNAL SERVER ERROR:
    An unexpected error has occurred in the service.

    ```json
    {
      "error": "Internal Server Error"
    }
    ```

---

### Get All Difficulties

- Usage: **GET** `http://localhost:5275/api/v1/question-service/questions/difficulties`

- Behaviour: Returns all distinct difficulties.

- Expected Response:
  - HTTP STATUS 200 OK:
    An array of difficulties is successfully fetched.

    ```json
    {
      "difficulties": [
        "Easy",
        "Hard",
        "Medium"
      ]
    }
    ```

  - HTTP STATUS 500 INTERNAL SERVER ERROR:
    An unexpected error has occurred in the service.

    ```json
    {
      "error": "Internal Server Error"
    }
    ```

---

### Get Categories with Difficulties

- Usage: **GET** `http://localhost:5275/api/v1/question-service/questions/categories-with-difficulties`

- Behaviour: Returns a mapping of categories to their available difficulty levels.

- Expected Response:
  - HTTP STATUS 200 OK:
    An array of category with difficulties is successfully fetched.

    ```json
    {
      "Concurrency": ["Easy","Medium"],
      "Database": ["Easy","Medium","Hard"],
      "Algorithms": ["Easy","Medium","Hard"],
      "JavaScript": ["Easy","Medium","Hard"],
      "pandas": ["Easy"],
      "Shell": ["Easy","Medium"]
    }
    ```

  - HTTP STATUS 500 INTERNAL SERVER ERROR:
    An unexpected error has occurred in the service.

    ```json
    {
      "error": "Internal Server Error"
    }
    ```
