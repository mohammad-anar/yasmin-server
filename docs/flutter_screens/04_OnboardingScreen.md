# Screen: Onboarding (Data Collection)

## Step 1: Fetch Dropdown Options
When the Onboarding screen loads, fetch the dynamic options for goals, symptoms, and contraception methods from the server so you can populate your Flutter dropdowns/pickers.

**Authentication Required:** None (Public)

- **Endpoint:** `GET /api/onboarding/options`
- **Response Type:** `application/json` (200 OK)
  - `success` (Boolean)
  - `data` (Object): Contains arrays for `goals`, `symptoms`, `contraceptions`, `dailyCheckIns`.

**Response Example:**
```json
{
  "success": true,
  "message": "Onboarding options retrieved successfully",
  "data": {
    "goals": [
      { "id": "uuid-1", "name": "Lose Weight", "createdAt": "2023-10-01T00:00:00Z" }
    ],
    "symptoms": [
      { "id": "uuid-2", "name": "Cramps", "createdAt": "2023-10-01T00:00:00Z" }
    ],
    "contraceptions": [],
    "dailyCheckIns": []
  }
}
```

## Step 2: Save Profile & Onboarding Data
When the user finishes the onboarding wizard, save their bodily metrics and chosen goals.

**Authentication Required:** `Authorization: Bearer <access_token>`

- **Endpoint:** `POST /api/profile`
- **Request Type:** `application/json`
  - `height_cm` (Number, optional)
  - `weight_kg` (Number, optional)
  - `fitness_level` (String, optional)
  - `goal` (String, optional)

**Request Example:**
```json
{
  "height_cm": 165,
  "weight_kg": 60.5,
  "fitness_level": "Intermediate",
  "goal": "Lose Weight"
}
```

- **Response Type:** `application/json` (201 Created)
**Response Example:**
```json
{
  "id": "uuid-profile",
  "created_by": "user@example.com",
  "height_cm": 165,
  "weight_kg": 60.5,
  "fitness_level": "Intermediate",
  "goal": "Lose Weight",
  "createdAt": "2023-10-01T12:00:00Z",
  "updatedAt": "2023-10-01T12:00:00Z"
}
```

## Step 3: Navigation
Navigate the user to the **Home / Dashboard Screen**.
