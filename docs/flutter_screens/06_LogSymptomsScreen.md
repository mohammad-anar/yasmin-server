# Screen: Log Symptoms & Daily Flow

**Authentication Required:** `Authorization: Bearer <access_token>`

## Step 1: Save Daily Flow & Mood
When the user selects their menstrual flow level or adds a note.

- **Endpoint:** `POST /api/cycle/daily-logs`
- **Request Type:** `application/json`
  - `date` (String YYYY-MM-DD, required)
  - `flowLevel` (String, optional)
  - `notes` (String, optional)

**Request Example:**
```json
{
  "date": "2023-10-15",
  "flowLevel": "Medium",
  "notes": "Feeling great today"
}
```

- **Response Type:** `application/json` (201 Created)
Returns the created `dailyLog` object.

## Step 2: Save Symptoms
When the user checks off physical or emotional symptoms.

- **Endpoint:** `POST /api/cycle/symptom-logs`
- **Request Type:** `application/json`
  - `date` (String YYYY-MM-DD, required)
  - `symptoms` (Array of Strings, required)
  - `severity` (Number, required)

**Request Example:**
```json
{
  "date": "2023-10-15",
  "symptoms": ["headache", "bloating", "cramps"],
  "severity": 3
}
```

- **Response Type:** `application/json` (201 Created)
Returns the created `symptomLog` object.
