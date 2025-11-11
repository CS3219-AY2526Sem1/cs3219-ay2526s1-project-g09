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

3. Clone `.env.example` and rename as `.env`.

4. Replace <db_password> with your MongoDB Atlas account password. Replace <gmail_account> with your Gmail address. This email address is used by PeerPrep to send verification emails to users. Replace <brevo_user> and <brevo_pass> with the respective values from Brevo. Brevo setup guide can be found [here](https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP)

5. Run the command `npm start` to start the User Service in production mode, or use `npm run dev` for development mode, which includes features like automatic server restart when you make code changes.

6. Using applications like Postman, you can interact with the User Service on port 5277. If you wish to change this, please update the `.env` file.

## Running with Docker

1. Follow steps 1 to 4 from [Running User Service](#running-user-service).

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

## API Overview

Base URL: `http://localhost:5277/api/v1/user-service`

Routes:
`http://localhost:5277/api/v1/user-service/auth`
`http://localhost:5277/api/v1/user-service/users`

Rate Limit: 100 requests/10 min

### CSRF Token

Every **POST**, **PUT**, **PATCH** or **DELETE** request requires a CSRF Token.

1. Ensure that CSRF Token is requested via **GET** `http://localhost:5277/api/v1/user-service/csrf-token` and the secret value is stored in cookie. Keep the derived token that is provided in the response.
   Example response:

```json
{
  "csrfToken": "y1GBjpke-1wfdxUaILWM9ztT8qIwBo6zyYVM"
}
```

2. Then for each **POST**, **PUT**, **PATCH** or **DELETE** request, ensure that the headers include `X-CSRF-Token: <derived token>` before sending the request.

### Authentication & Session Behavior

| rememberMe | JWT Lifetime | Cookie Lifetime              | Behavior                                                                                   |
| ---------- | ------------ | ---------------------------- | ------------------------------------------------------------------------------------------ |
| false      | 1 day        | Session cookie (no `maxAge`) | Cookie expires when browser is closed; JWT remains valid for up to 24 hours if cookie persists |
| true       | 30 days      | 30 days                      | Persists for 30 days                                                                       |

## API Reference

### Registering a User

- Usage: **POST** `http://localhost:5277/api/v1/user-service/users`

- Behaviour: Registers a new user account with username, email, and password.

- Headers

  | Name           | Type   | Required | Description             |
  | -------------- | ------ | -------- | ----------------------- |
  | `X-CSRF-Token` | string | Yes      | CSRF token for security |

  Postman Usage: Refer to [CSRF Token](#csrf-token)

- Body

  | Name       | Type   | Required | Description                                                          |
  | ---------- | ------ | -------- | -------------------------------------------------------------------- |
  | `username` | string | Yes      | Username for the account (3-20 characters, letters and numbers only) |
  | `email`    | string | Yes      | Email address for the account                                        |
  | `password` | string | Yes      | Password for the account (must meet security requirements)           |

  Username requirements:
  - Username must be 3–20 characters
  - Username should only contain letters and numbers

  Password requirements:
  - Password must be at least 12 characters long
  - Password should have at least 1 uppercase and 1 lowercase character
  - Password should contain a number
  - Password should contain a special character
    - Special characters include: `!"#$%&'()*+,-./\:;<=>?@[]^_`{|}~`
  - Password should not contain any whitespace
  - Password should not exceed 64 characters

  ```json
  {
    "username": "SampleUser1",
    "email": "sample1@gmail.com",
    "password": "SecurePassword123!"
  }
  ```

- Expected Response:
  - HTTP STATUS 201 CREATED: User account successfully created.

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

- Usage: **POST** `http://localhost:5277/api/v1/user-service/auth/login`

- Behaviour: Authenticates a user with their credentials and creates a session.

- Headers

  | Name           | Type   | Required | Description             |
  | -------------- | ------ | -------- | ----------------------- |
  | `X-CSRF-Token` | string | Yes      | CSRF token for security |

  Postman Usage: Refer to [CSRF Token](#csrf-token)

- Body

  | Name         | Type    | Required | Description                                                                                                     |
  | ------------ | ------- | -------- | --------------------------------------------------------------------------------------------------------------- |
  | `email`      | string  | Yes      | Email address of the user                                                                                       |
  | `password`   | string  | Yes      | Password for the account                                                                                        |
  | `rememberMe` | boolean | Yes      | Whether to extend session lifetime (see [Authentication & Session Behavior](#authentication--session-behavior)) |

  ```json
  {
    "email": "sample1@gmail.com",
    "password": "SecurePassword",
    "rememberMe": false
  }
  ```

- Expected Response:
  - HTTP STATUS 200 OK: User successfully authenticated and logged in.

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

- Usage: **GET** `http://localhost:5277/api/v1/user-service/users/{userId}`

- Behaviour: Retrieves user information for the specified user ID.

- Parameters

  | Name     | Type   | Required | Description                    |
  | -------- | ------ | -------- | ------------------------------ |
  | `userId` | string | Yes      | The ID of the user to retrieve |

  Example: `http://localhost:5277/api/v1/user-service/users/60c72b2f9b1d4c3a2e5f8b4c`

- Expected Response:
  - HTTP STATUS 200 OK: User information successfully retrieved.

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

- Usage: **PATCH** `http://localhost:5277/api/v1/user-service/users/{userId}`

- Behaviour: Updates user information for the specified user. At least one field must be provided.

- Headers

  | Name           | Type   | Required | Description             |
  | -------------- | ------ | -------- | ----------------------- |
  | `X-CSRF-Token` | string | Yes      | CSRF token for security |

  Postman Usage: Refer to [CSRF Token](#csrf-token)

- Parameters

  | Name     | Type   | Required | Description                  |
  | -------- | ------ | -------- | ---------------------------- |
  | `userId` | string | Yes      | The ID of the user to update |

  Example: `http://localhost:5277/api/v1/user-service/users/60c72b2f9b1d4c3a2e5f8b4c`

- Body

  | Name       | Type   | Required | Description                                                              |
  | ---------- | ------ | -------- | ------------------------------------------------------------------------ |
  | `username` | string | No       | New username for the account (3-20 characters, letters and numbers only) |
  | `email`    | string | No       | New email address for the account                                        |
  | `password` | string | No       | New password for the account (must meet security requirements)           |

  Note: At least one field must be provided.

  ```json
  {
    "username": "SampleUserName",
    "email": "sample@gmail.com",
    "password": "SecurePassword"
  }
  ```

- Expected Response:
  - HTTP STATUS 200 OK: User information successfully updated.

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

- Usage: **DELETE** `http://localhost:5277/api/v1/user-service/users/{userId}`

- Behaviour: Deletes the specified user account permanently.

- Headers

  | Name           | Type   | Required | Description             |
  | -------------- | ------ | -------- | ----------------------- |
  | `X-CSRF-Token` | string | Yes      | CSRF token for security |

  Postman Usage: Refer to [CSRF Token](#csrf-token)

- Parameters

  | Name     | Type   | Required | Description                  |
  | -------- | ------ | -------- | ---------------------------- |
  | `userId` | string | Yes      | The ID of the user to delete |

  Example: `http://localhost:5277/api/v1/user-service/users/60c72b2f9b1d4c3a2e5f8b4c`

- Expected Response:
  - HTTP STATUS 200 OK: User successfully deleted.

    ```json
    {
      "message": "Deleted user {userId} successfully"
    }
    ```

### Verify Token

- Usage: **GET** `http://localhost:5277/api/v1/user-service/auth/verify-token`

- Behaviour: Verifies the validity of the current JWT token and returns user information.

- Expected Response:
  - HTTP STATUS 200 OK: Token is valid.

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

- Usage: **POST** `http://localhost:5277/api/v1/user-service/auth/send-otp`

- Behaviour: Sends a one-time password (OTP) to the specified email address for email verification.

- Headers

  | Name           | Type   | Required | Description             |
  | -------------- | ------ | -------- | ----------------------- |
  | `X-CSRF-Token` | string | Yes      | CSRF token for security |

  Postman Usage: Refer to [CSRF Token](#csrf-token)

- Body

  | Name    | Type   | Required | Description                      |
  | ------- | ------ | -------- | -------------------------------- |
  | `email` | string | Yes      | Email address to send the OTP to |

  ```json
  {
    "email": "sample@gmail.com"
  }
  ```

- Expected Response:
  - HTTP STATUS 200 OK: OTP successfully sent to the email address.

    ```json
    {
      "message": "OTP sent to your email"
    }
    ```

### Verify OTP

- Usage: **POST** `http://localhost:5277/api/v1/user-service/auth/verify-otp`

- Behaviour: Verifies the OTP sent to the user's email and marks the account as verified.

- Headers

  | Name           | Type   | Required | Description             |
  | -------------- | ------ | -------- | ----------------------- |
  | `X-CSRF-Token` | string | Yes      | CSRF token for security |

  Postman Usage: Refer to [CSRF Token](#csrf-token)

- Body

  | Name    | Type   | Required | Description                              |
  | ------- | ------ | -------- | ---------------------------------------- |
  | `email` | string | Yes      | Email address associated with the OTP    |
  | `otp`   | string | Yes      | The one-time password received via email |

  ```json
  {
    "email": "sample@gmail.com",
    "otp": "123456"
  }
  ```

- Expected Response:
  - HTTP STATUS 200 OK: Email successfully verified.

    ```json
    {
      "message": "Email verified successfully",
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

### Logging Out

- Usage: **POST** `http://localhost:5277/api/v1/user-service/auth/logout`

- Behaviour: Logs out the current user and invalidates their session.

- Headers

  | Name           | Type   | Required | Description             |
  | -------------- | ------ | -------- | ----------------------- |
  | `X-CSRF-Token` | string | Yes      | CSRF token for security |

  Postman Usage: Refer to [CSRF Token](#csrf-token)

- Expected Response:
  - HTTP STATUS 200 OK: User successfully logged out.

    ```json
    {
      "message": "Logged out"
    }
    ```

### User Forgot Password, Request Reset Link

- Usage: **POST** `http://localhost:5277/api/v1/user-service/auth/forgot-password`

- Behaviour: Sends a password reset link to the user's email address. Returns success regardless of whether the email exists (for security reasons).

- Headers

  | Name           | Type   | Required | Description             |
  | -------------- | ------ | -------- | ----------------------- |
  | `X-CSRF-Token` | string | Yes      | CSRF token for security |

  Postman Usage: Refer to [CSRF Token](#csrf-token)

- Body

  | Name    | Type   | Required | Description                         |
  | ------- | ------ | -------- | ----------------------------------- |
  | `email` | string | Yes      | Email address to send reset link to |

  ```json
  {
    "email": "sample@gmail.com"
  }
  ```

- Expected Response:
  - HTTP STATUS 200 OK: Request processed. Note: Returns success regardless of whether email exists (for security).

    ```json
    {
      "ok": true
    }
    ```

### Reset Password

- Usage: **POST** `http://localhost:5277/api/v1/user-service/auth/reset-password?token={resetToken}`

- Behaviour: Resets the user's password using a valid reset token received via email.

- Headers

  | Name           | Type   | Required | Description             |
  | -------------- | ------ | -------- | ----------------------- |
  | `X-CSRF-Token` | string | Yes      | CSRF token for security |

  Postman Usage: Refer to [CSRF Token](#csrf-token)

- Parameters

  | Name         | Type   | Required | Description                                 |
  | ------------ | ------ | -------- | ------------------------------------------- |
  | `resetToken` | string | Yes      | The password reset token received via email |

- Body

  | Name          | Type   | Required | Description                                                    |
  | ------------- | ------ | -------- | -------------------------------------------------------------- |
  | `newPassword` | string | Yes      | New password for the account (must meet security requirements) |

  Password requirements:
  - Password must be at least 12 characters long
  - Password should have at least 1 uppercase and 1 lowercase character
  - Password should contain a number
  - Password should contain a special character
    - Special characters include: `!"#$%&'()*+,-./\:;<=>?@[]^_`{|}~`
  - Password should not contain any whitespace
  - Password should not exceed 64 characters

  ```json
  {
    "newPassword": "newPassword123!"
  }
  ```

- Expected Response:
  - HTTP STATUS 200 OK: Password successfully reset.

    ```json
    {
      "message": "Password reset successful"
    }
    ```
