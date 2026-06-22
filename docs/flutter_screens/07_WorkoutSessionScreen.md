# Screen: Workout Session

**Authentication Required:** `Authorization: Bearer <access_token>`

## Step 1: Start a Workout Session
When the user taps "Start Workout", create a session in the database.

- **Endpoint:** `POST /api/workout/workout-sessions`
- **Request Type:** `application/json`
  - `workout_name` (String, required)
  - `duration_minutes` (Number, optional, default 0)
  - `completed` (Boolean, optional, default false)

**Request Example:**
```json
{
  "workout_name": "Full Body Strength",
  "duration_minutes": 0,
  "completed": false
}
```

- **Response Type:** `application/json` (201 Created)
Save the returned `id` (the session ID) in Flutter state so you can update it later.

**Response Example:**
```json
{
  "id": "uuid-session-123",
  "created_by": "user@example.com",
  "workout_name": "Full Body Strength",
  "duration_minutes": 0,
  "completed": false,
  "createdAt": "2023-10-15T10:00:00.000Z"
}
```

## Step 2: Finish Workout Session
When the user stops the timer and finishes the workout.

- **Endpoint:** `PUT /api/workout/workout-sessions/<session_id>`
- **Request Type:** `application/json`
  - `duration_minutes` (Number, required)
  - `completed` (Boolean, required - MUST be true)

**Request Example:**
```json
{
  "duration_minutes": 45,
  "completed": true
}
```

- **Response Type:** `application/json` (200 OK)
*(Note: Changing `completed: true` automatically triggers the backend to push a Milestone Notification).*
