# Screen: Register / Sign Up

**Authentication Required:** None (Public)

## Step 1: User Registration
When the user fills out the form and taps "Sign Up", call this API.

- **Endpoint:** `POST /api/auth/register`
- **Request Type:** `application/json`
  - `email` (String, required)
  - `password` (String, required)
  - `username` (String, optional)
  - `name` (String, optional)

**Request Example:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "username": "fitness_jane",
  "name": "Jane Doe"
}
```

- **Response Type:** `application/json` (201 Created)
  - `access_token` (String)
  - `refresh_token` (String)
  - `user` (Object):
    - `id` (String)
    - `email` (String)
    - `username` (String)
    - `name` (String)
    - `role` (String)

**Response Example:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "user": {
    "id": "cm1j2a3b40000a1b2c3d4e5f6",
    "email": "user@example.com",
    "username": "fitness_jane",
    "name": "Jane Doe",
    "role": "user"
  }
}
```

## Step 2: Handle Tokens
Save the `access_token` and `refresh_token` securely (e.g., using `flutter_secure_storage`).

## Step 3: Navigation
Navigate the user to the **Onboarding Screen**.
