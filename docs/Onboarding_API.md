# Onboarding API Documentation

## Public Endpoints

### 1. Get Onboarding Options (Auth optional)
- **Endpoint:** `GET /api/onboarding/options`
- **Description:** Retrieves all predefined options for the onboarding flow (Goals, Symptoms, Contraception methods, Check-ins). Used by the frontend (Flutter App) to populate dropdowns/lists.
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Onboarding options retrieved successfully",
    "data": {
      "contraceptions": [],
      "goals": [],
      "symptoms": [],
      "dailyCheckIns": []
    }
  }
  ```

---

## Admin Endpoints (Requires ADMIN role)

All of the following endpoints require an admin token `Authorization: Bearer <access_token>`. These are primarily used by the **Yasmin Dashboard** admin panel to manage the options that appear in the Flutter App.

### 1. Seed Initial Data
- **Endpoint:** `POST /api/onboarding/seed/:step`
- **Description:** Auto-seeds predefined options into the database. `step` is a number (e.g. 1).
- **Response (200 OK):** `{ "success": true, "message": "..." }`

### 2. Manage Contraception
- **Create:** `POST /api/onboarding/contraception`
  - **Body:** `{ "name": "Pill", "description": "Oral contraceptive" }`
- **Delete:** `DELETE /api/onboarding/contraception/:id`

### 3. Manage Contraception Details
- **Create:** `POST /api/onboarding/contraception-detail`
  - **Body:** `{ "contraceptionId": "uuid", "detailName": "Combination Pill" }`
- **Delete:** `DELETE /api/onboarding/contraception-detail/:id`

### 4. Manage Goals
- **Create:** `POST /api/onboarding/goal`
  - **Body:** `{ "name": "Lose Weight" }`
- **Delete:** `DELETE /api/onboarding/goal/:id`

### 5. Manage Symptoms
- **Create:** `POST /api/onboarding/symptom`
  - **Body:** `{ "name": "Headache" }`
- **Delete:** `DELETE /api/onboarding/symptom/:id`

### 6. Manage Daily Check-Ins
- **Create:** `POST /api/onboarding/daily-check-in`
  - **Body:** `{ "name": "Mood", "type": "slider" }`
- **Delete:** `DELETE /api/onboarding/daily-check-in/:id`
