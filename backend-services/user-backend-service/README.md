# PeerPrep - User Backend Service

Express.js service that:

- Provides structured RESTful API endpoints
- Uses JWT authentication
- Maintains user database with MongoDB Atlas

## Tech

- Express.js
- Node.js
- Mongoose (MongoDB)
- JavaScript

## Running User Service

**Before running** check for the following requirements:

- Node.js 18 or higher
- MongoDB Atlas
- npm

1. Open Command Line/Terminal and navigate into the `user-backend-service` directory.

2. Run the command: `npm install`. This will install all the necessary dependencies.

3. Clone `.env.example` and rename as `.env`. Then replace <db_password> with your MongoDB Atlas account password. Then replace <gmail_app_password> with your Gmail account app password.

4. Run the command `npm start` to start the User Service in production mode, or use `npm run dev` for development mode, which includes features like automatic server restart when you make code changes.

5. Using applications like Postman, you can interact with the User Service on port 5277. If you wish to change this, please update the `.env` file.

## Running with Docker

1. Follow steps 1 to 3 from Running User Service.

2. Run `docker compose up --build`.

3. Using applications like Postman, you can interact with the User Service on port 5277. If you wish to change this, please update the `.env` file.

## Project Structure

```
src/
  index.js                    # Starts the server and establish routes
  server.js                   # Establish connection to MongoDB

  controller/
    auth-controller.js        # Functions that involves jwt and otp
    user-controller.js        # All other user management functions

  middleware/
    basic-access-control.js   # Functions to verify jwt and account owner
    rate-limiter.js           # Rate limiter for each endpoint

  model/
    otp-model.js              # schema to store otp for verifying emails
    repository.js             # CRUD operations with db
    user-model.js             # schema for user data

  routes/
    auth-routes.js            # contain routes for /auth
    user-routes.js            # contain routes for /users

  utils/
    email-sender.js           # Uses nodemailer to send otp to users
    errors.js                 # Custom error for user service
    repository-security.js    # Enforces user input security and password strength
```

## API

Base URL: `http://localhost:5277/api/user-service`
Routes:
`http://localhost:5277/api/user-service/auth`
`http://localhost:5277/api/user-service/users`

Rate Limit: 100 requests/10 min

### CSRF Token

Every **POST**, **PUT**, **PATCH** or **DELETE** request requires a CSRF Token.

1. Ensure that CSRF Token is requested via **GET** `http://localhost:5277/api/csrf-token` and the secret value is stored in cookie. Keep the derived token that is provided in the response.
   Example response:

```json
{
  "csrfToken": "y1GBjpke-1wfdxUaILWM9ztT8qIwBo6zyYVM"
}
```

2. Then for each **POST**, **PUT**, **PATCH** or **DELETE** request, ensure that the headers include `X-CSRF-Token: <derived token>` before sending the request.

### Registering a User

- Usage:

  **POST** `http://localhost:5277/api/user-service/users`

- Headers
  - Required: `X-CSRF-Token: <CSRF-derived-token>`

  - Postman Usage: Refer to [CSRF Token](#csrf-token)

- Body
  - Required: `username` (string), `email` (string), `password` (string)

    ```json
    {
      "username": "SampleUser1",
      "email": "sample1@gmail.com",
      "password": "SecurePassword123!"
    }
    ```

  - Note: Username should meet the following requirements:
    - Username must be 3–20 characters
    - Username should only contain letters and numbers

  - Note: Password should meet the following requirements:
    - Password is 12 characters long
    - Password should have at least 1 uppercase and 1 lowercase character
    - Password should contain a number
    - Password should contain a special character
      - Special characters include: `!"#$%&'()*+,-./\:;<=>?@[]^_`{|}~`
    - Password should not contain any whitespace
    - Password should not exceed 64 characters

- Expected Response:
  ```json
  {
    "message": "Created new user SampleUser1 successfully",
    "data": {
      "id": "<userId>",
      "username": "SampleUser1",
      "email": "sample1@gmail.com",
      "isAdmin": false,
      "isVerified": false,
      "createdAt": "2025-09-22T13:55:40.590Z"
    }
  }
  ```

### Login with User Details

- Usage:

  **POST** `http://localhost:5277/api/user-service/auth/login`

- Headers
  - Required: `X-CSRF-Token: <CSRF-derived-token>`

  - Postman Usage: Refer to [CSRF Token](#csrf-token)

- Body
  - Required: `email` (string), `password` (string), `rememberMe` (boolean)

    ```json
    {
      "email": "sample1@gmail.com",
      "password": "SecurePassword",
      "rememberMe": "false"
    }
    ```

- Expected Response:
  ```json
  {
    "message": "User logged in",
    "data": {
      "id": "<userId>",
      "username": "SampleUser1",
      "email": "sample1@gmail.com",
      "isAdmin": false,
      "isVerified": true,
      "createdAt": "2025-09-22T13:55:40.590Z"
    }
  }
  ```

### Get User

- Usage:

**GET** `http://localhost:5277/api/user-service/users/{userId}`

- Parameters
  - Required: `userId` path parameter

  - Example: `http://localhost:5277/api/user-service/users/60c72b2f9b1d4c3a2e5f8b4c`

- Expected Response:
  ```json
  {
    "message": "Found user",
    "data": {
      "id": "<userId>",
      "username": "SampleUser1",
      "email": "sample1@gmail.com",
      "isAdmin": false,
      "isVerified": true,
      "createdAt": "2025-09-22T13:55:40.590Z"
    }
  }
  ```

### Update User

- Usage:

**PATCH** `http://localhost:5277/api/user-service/users/{userId}`

- Headers
  - Required: `X-CSRF-Token: <CSRF-derived-token>`

  - Postman Usage: Refer to [CSRF Token](#csrf-token)

- Parameters
  - Required: `userId` path parameter

  - Example: `http://localhost:5277/api/user-service/users/60c72b2f9b1d4c3a2e5f8b4c`

- Body
  - At least one of the following fields is required: `username` (string), `email` (string), `password` (string)

    ```json
    {
      "username": "SampleUserName",
      "email": "sample@gmail.com",
      "password": "SecurePassword"
    }
    ```

- Expected Response:
  ```json
  {
    "message": "Updated data for user {userId}",
    "data": {
      "id": "{userId}",
      "username": "SampleUser123",
      "email": "sample2@gmail.com",
      "isAdmin": false,
      "isVerified": true,
      "createdAt": "2025-09-22T13:55:40.590Z"
    }
  }
  ```

### Delete User

- Usage:

**DELETE** `http://localhost:5277/api/user-service/users/{userId}`

- Headers
  - Required: `X-CSRF-Token: <CSRF-derived-token>`

  - Postman Usage: Refer to [CSRF Token](#csrf-token)

- Parameters
  - Required: `userId` path parameter

  - Example: `http://localhost:5277/api/user-service/users/60c72b2f9b1d4c3a2e5f8b4c`

- Expected Response:
  ```json
  {
    "message": "Deleted user {userId} successfully"
  }
  ```

### Verify Token

- Usage:

**GET** `http://localhost:5277/api/user-service/auth/verify-token`

- Expected Response:
  ```json
  {
    "message": "Token verified",
    "data": {
      "id": "{userId}",
      "username": "SampleUser123",
      "email": "sample123@gmail.com",
      "isAdmin": false
    }
  }
  ```

### Send OTP

- Usage:

**POST** `http://localhost:5277/api/user-service/auth/send-otp`

- Headers
  - Required: `X-CSRF-Token: <CSRF-derived-token>`

  - Postman Usage: Refer to [CSRF Token](#csrf-token)

- Body
  - Required: `email` (string)

    ```json
    {
      "email": "sample@gmail.com"
    }
    ```

- Expected Response:
  ```json
  {
    "message": "OTP sent to your email"
  }
  ```

### Verify OTP

- Usage:

**POST** `http://localhost:5277/api/user-service/auth/verify-otp`

- Headers
  - Required: `X-CSRF-Token: <CSRF-derived-token>`

  - Postman Usage: Refer to [CSRF Token](#csrf-token)

- Body
  - Required: `email` (string), `otp` (string)

    ```json
    {
      "email": "sample@gmail.com",
      "otp": "123456"
    }
    ```

- Expected Response:
  ```json
  {
    "message": "Email verified successfully",
    "accessToken": "<jwt-access-token>",
    "data": {
      "id": "<userId>",
      "username": "SampleUser1",
      "email": "sample1@gmail.com",
      "isAdmin": false,
      "isVerified": true,
      "createdAt": "2025-09-22T13:55:40.590Z"
    }
  }
  ```
