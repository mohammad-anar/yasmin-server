# Screen: Personal Records (PRs)

**Authentication Required:** `Authorization: Bearer <access_token>`

## Step 1: Fetch Existing PRs
- **Endpoint:** `GET /api/workout/personal-records`
- **Response Type:** `Array of Objects` (200 OK)

## Step 2: Log a New Heavy Lift
When the user logs a max weight for a specific exercise.

- **Endpoint:** `POST /api/workout/personal-records`
- **Request Type:** `application/json`
  - `exercise_name` (String, required)
  - `weight_kg` (Number, required)
  - `reps` (Number, required)

**Request Example:**
```json
{
  "exercise_name": "Squat",
  "weight_kg": 80,
  "reps": 5
}
```

- **Response Type:** `application/json` (201 Created)
The backend automatically calculates the `one_rep_max` (1RM) based on weight and reps. *It also triggers a PR Notification automatically!*

**Response Example:**
```json
{
  "id": "uuid-pr-123",
  "created_by": "user@example.com",
  "exercise_name": "Squat",
  "weight_kg": 80,
  "reps": 5,
  "one_rep_max": 93.33,
  "createdAt": "2023-10-15T11:00:00.000Z"
}
```
