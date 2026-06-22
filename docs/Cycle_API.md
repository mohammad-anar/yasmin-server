# Cycle API Documentation

All routes require authentication header: `Authorization: Bearer <access_token>`

## Cycle Data
- **Create:** `POST /api/cycle/cycle-data` (Body: `startDate`, `endDate`, `cycleLength`, `periodLength`)
- **Get All:** `GET /api/cycle/cycle-data`
- **Update:** `PUT /api/cycle/cycle-data/:id`
- **Delete:** `DELETE /api/cycle/cycle-data/:id`

## Daily Logs
- **Create:** `POST /api/cycle/daily-logs` (Body: `date`, `flowLevel`, `notes`)
- **Get All:** `GET /api/cycle/daily-logs` (Params: `?date=YYYY-MM-DD`)
- **Update:** `PUT /api/cycle/daily-logs/:id`
- **Delete:** `DELETE /api/cycle/daily-logs/:id`

## Symptom Logs
- **Create:** `POST /api/cycle/symptom-logs` (Body: `date`, `symptoms: []`, `severity`)
- **Get All:** `GET /api/cycle/symptom-logs`
- **Update:** `PUT /api/cycle/symptom-logs/:id`
- **Delete:** `DELETE /api/cycle/symptom-logs/:id`
