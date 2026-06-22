# Screen: Settings & Profile Dashboard

**Authentication Required:** `Authorization: Bearer <access_token>`

## Step 1: Fetch User Details
To display the user's name, email, and username in settings.

- **Endpoint:** `GET /api/auth/me`
- **Response Type:** `application/json` (200 OK)

**Response Example:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Jane Doe",
  "username": "fitness_jane",
  "role": "user"
}
```

## Step 2: Update Name or Details
When user saves edits to their basic profile.

- **Endpoint:** `PUT /api/auth/me`
- **Request Type:** `application/json`
  - `name` (String, optional)
  - `username` (String, optional)

**Request Example:**
```json
{
  "name": "Jane Updated",
  "username": "jane_updated"
}
```

- **Response Type:** `application/json` (200 OK)

## Step 3: Change Password
- **Endpoint:** `POST /api/auth/change-password`
- **Request Type:** `application/json`
  - `currentPassword` (String, required)
  - `newPassword` (String, required)

**Request Example:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

- **Response Type:** `application/json` (200 OK)
**Response Example:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

## Step 4: Delete Account
When the user taps "Delete Account" in the dangerous zone.

- **Endpoint:** `DELETE /api/auth/me`
- **Action Required on Client:** After receiving 200 OK, clear all tokens from `flutter_secure_storage` and forcefully navigate back to the Login Screen.
