# Screen: Login

**Authentication Required:** None (Public)

## Step 1: Authenticate User
When the user taps "Login", verify their credentials.

- **Endpoint:** `POST /api/auth/login`
- **Request Type:** `application/json`
  - `email` (String, required)
  - `password` (String, required)

**Request Example:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

- **Response Type:** `application/json` (200 OK)
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
Save the `access_token` and `refresh_token` securely.

## Step 3: Navigation
Navigate the user to the **Home / Dashboard Screen**.
