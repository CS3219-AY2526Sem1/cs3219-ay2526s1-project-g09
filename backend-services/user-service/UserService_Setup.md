# PeerPrep - User Service Setup

## Port Usage:

Port 5277 should be used for all API calls to User Service
Port 465 are used in User Service to send an email for the OTP feature

## Running User Service

1. Open Command Line/Terminal and navigate into the `user-service` directory.

2. Run the command: `npm install`. This will install all the necessary dependencies.

3. Run the command `npm start` to start the User Service in production mode, or use `npm run dev` for development mode, which includes features like automatic server restart when you make code changes.

4. Using applications like Postman, you can interact with the User Service on port 5277. If you wish to change this, please update the `.env` file.

## Running with Docker

-- To be filled --

## API

Base URL: `http://localhost:5277/api/user-service`
Routes:
`http://localhost:5277/api/user-service/auth`
`http://localhost:5277/api/user-service/users`

Rate Limit: 100 requests/10 min

### Registering a User

- Usage:
  **POST** `http://localhost:5277/api/user-service/users`

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
      "id": "<user-unique-id>",
      "username": "SampleUser1",
      "email": "sample1@gmail.com",
      "isAdmin": false,
      "createdAt": "2025-09-22T13:55:40.590Z"
    }
  }
  ```

### Login with User Details

- Usage:
  **POST** `http://localhost:5277/api/user-service/auth/login`

- Body
  - Required: `email` (string), `password` (string)

    ```json
    {
      "email": "sample1@gmail.com",
      "password": "SecurePassword"
    }
    ```

- Expected Response:
  ```json
  {
    "message": "User logged in",
    "data": {
      "accessToken": "<jwt-access-token>",
      "id": "<userId>",
      "username": "SampleUser1",
      "email": "sample1@gmail.com",
      "isAdmin": false,
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

- Headers
  - Required: `Authorization: Bearer <JWT_ACCESS_TOKEN>`

  - Postman Usage: Select Auth -> Auth Type -> Bearer Token, then
    copy and paste the `<jwt-access-token>` from logging in.

- Expected Response:
  ```json
  {
    "message": "Found user",
    "data": {
      "id": "<userId>",
      "username": "SampleUser1",
      "email": "sample1@gmail.com",
      "isAdmin": false,
      "createdAt": "2025-09-22T13:55:40.590Z"
    }
  }
  ```

### Update User

- Usage:

**PATCH** `http://localhost:5277/api/user-service/users/{userId}`

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

- Headers
  - Required: `Authorization: Bearer <JWT_ACCESS_TOKEN>`

  - Postman Usage: Select Auth -> Auth Type -> Bearer Token, then
    copy and paste the `<jwt-access-token>` from logging in.

- Expected Response:
  ```json
  {
    "message": "Updated data for user {userId}",
    "data": {
      "id": "{userId}",
      "username": "SampleUser123",
      "email": "sample2@gmail.com",
      "isAdmin": false,
      "createdAt": "2025-09-22T13:55:40.590Z"
    }
  }
  ```

### Delete User

- Usage:

**DELETE** `http://localhost:5277/api/user-service/users/{userId}`

- Parameters
  - Required: `userId` path parameter

  - Example: `http://localhost:5277/api/user-service/users/60c72b2f9b1d4c3a2e5f8b4c`

- Headers
  - Required: `Authorization: Bearer <JWT_ACCESS_TOKEN>`

  - Postman Usage: Select Auth -> Auth Type -> Bearer Token, then
    copy and paste the `<jwt-access-token>` from logging in.

- Expected Response:
  ```json
  {
    "message": "Deleted user {userId} successfully"
  }
  ```

### Verify Token

- Usage:

**GET** `http://localhost:5277/api/user-service/auth/verify-token`

- Headers
  - Required: `Authorization: Bearer <JWT_ACCESS_TOKEN>`

  - Postman Usage: Select Auth -> Auth Type -> Bearer Token, then
    copy and paste the `<jwt-access-token>` from logging in.

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
    "message": "Email verified successfully"
  }
  ```
