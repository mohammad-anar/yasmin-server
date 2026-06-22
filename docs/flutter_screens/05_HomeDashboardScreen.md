# Screen: Home / Dashboard

**Authentication Required:** `Authorization: Bearer <access_token>`

## Step 1: Fetch Cycle Data
Used to render the calendar and cycle predictions.

- **Endpoint:** `GET /api/cycle/cycle-data`
- **Response Type:** `Array of Objects` (200 OK)

**Response Example:**
```json
[
  {
    "id": "uuid-cycle",
    "created_by": "user@example.com",
    "startDate": "2023-10-01T00:00:00.000Z",
    "endDate": null,
    "cycleLength": 28,
    "periodLength": 5,
    "createdAt": "2023-10-01T12:00:00.000Z",
    "updatedAt": "2023-10-01T12:00:00.000Z"
  }
]
```

## Step 2: Fetch Notifications Bell
Check if there are any unread notifications for the user (e.g. workout milestones or PRs).

- **Endpoint:** `GET /api/notification`
- **Response Type:** `Array of Objects` (200 OK)

**Response Example:**
```json
[
  {
    "id": "uuid-notif",
    "created_by": "user@example.com",
    "type": "workout_milestone",
    "title": "Workout Completed",
    "message": "Great workout! You completed 'Full Body' in 45 minutes.",
    "read": false,
    "related_record_id": "uuid-workout",
    "related_record_type": "workout_session",
    "createdAt": "2023-10-01T14:30:00.000Z"
  }
]
```

## Step 3: Fetch Today's Daily Log (Optional)
Check if the user has already logged their symptoms or flow today.

- **Endpoint:** `GET /api/cycle/daily-logs?date=YYYY-MM-DD`
- **Response Type:** `Array of Objects` (200 OK). If empty, user hasn't logged today.
