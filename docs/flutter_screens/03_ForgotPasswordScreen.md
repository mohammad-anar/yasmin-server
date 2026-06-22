# Screen: Forgot Password / OTP Flow

**Authentication Required:** None (Public)

## Step 1: Request OTP
When the user enters their email to reset their password.

- **Endpoint:** `POST /api/auth/forgot-password`
- **Request Type:** `application/json`
  - `email` (String, required)

**Request Example:**
```json
{
  "email": "user@example.com"
}
```

- **Response Type:** `application/json` (200 OK)
**Response Example:**
```json
{
  "success": true,
  "message": "OTP sent successfully to your email"
}
```

## Step 2: Verify OTP
When the user enters the 6-digit code received in their email.

- **Endpoint:** `POST /api/auth/verify-otp`
- **Request Type:** `application/json`
  - `email` (String, required)
  - `otp` (String, required)

**Request Example:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

- **Response Type:** `application/json` (200 OK)
  - `resetToken` (String) - *A temporary token used strictly for resetting the password (valid for 15 mins).*

**Response Example:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "resetToken": "temp_jwt_token_here"
}
```

## Step 3: Reset Password
When the user types their new password.

- **Endpoint:** `POST /api/auth/reset-password`
- **Request Type:** `application/json`
  - `resetToken` (String, required)
  - `newPassword` (String, required)

**Request Example:**
```json
{
  "resetToken": "temp_jwt_token_here",
  "newPassword": "newsecurepassword456"
}
```

- **Response Type:** `application/json` (200 OK)
**Response Example:**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

## Step 4: Navigation
Navigate the user back to the **Login Screen**.
