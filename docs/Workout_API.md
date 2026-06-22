# Workout API Documentation

All routes require authentication header: `Authorization: Bearer <access_token>`

## Workout Logs
- **Create:** `POST /api/workout/workout-logs` (Body: `date`, `workoutType`, `durationMinutes`)
- **Get All:** `GET /api/workout/workout-logs`
- **Update:** `PUT /api/workout/workout-logs/:id`
- **Delete:** `DELETE /api/workout/workout-logs/:id`

## Workout Sessions
- **Create:** `POST /api/workout/workout-sessions` (Body: `workout_name`, `duration_minutes`, `completed`)
- **Get All:** `GET /api/workout/workout-sessions`
- **Update (e.g. mark completed):** `PUT /api/workout/workout-sessions/:id` (Body: `{ "completed": true }`) - *Triggers Milestone Notification*
- **Delete:** `DELETE /api/workout/workout-sessions/:id`

## Personal Records (PR)
- **Create:** `POST /api/workout/personal-records` (Body: `exercise_name`, `weight_kg`, `reps`) - *Calculates 1RM and Triggers PR Notification*
- **Get All:** `GET /api/workout/personal-records`
- **Update:** `PUT /api/workout/personal-records/:id`
- **Delete:** `DELETE /api/workout/personal-records/:id`
