# Auth API Documentation

## Public Routes

### 1. Register User
- **Endpoint:** `POST /api/auth/register`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "username": "user123", // optional
    "name": "John Doe" // optional
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "access_token": "jwt_token",
    "refresh_token": "jwt_refresh_token",
    "user": { ... }
  }
  ```

### 2. Login User
- **Endpoint:** `POST /api/auth/login`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
- **Response (200 OK):** Contains access_token, refresh_token, user object.

### 3. Refresh Token
- **Endpoint:** `POST /api/auth/refresh-token`
- **Request Body:** `{ "refresh_token": "..." }`
- **Response (200 OK):** New tokens.

### 4. Forgot Password & OTP
- **Forgot Password:** `POST /api/auth/forgot-password` (Body: `email`)
- **Verify OTP:** `POST /api/auth/verify-otp` (Body: `email`, `otp`) -> Returns resetToken
- **Reset Password:** `POST /api/auth/reset-password` (Body: `resetToken`, `newPassword`)

---

## Authenticated User Routes (Requires Bearer Token)

- **Get Me:** `GET /api/auth/me`
- **Update Me:** `PUT /api/auth/me` (Update basic user info)
- **Change Password:** `POST /api/auth/change-password` (Body: `currentPassword`, `newPassword`)
- **Delete Account:** `DELETE /api/auth/me`
