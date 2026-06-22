# Flutter App: Exhaustive API Integration Manual

This manual provides a **page-by-page**, step-by-step guide for integrating the backend APIs. It includes the exact **Request and Response Data Types** and comprehensive JSON examples.

**Base URL:** `https://your-server-url.com`  
**Authentication Header:** `Authorization: Bearer <access_token>` (Required for all routes unless explicitly marked *Public*).

---

## 📱 Phase 1: Authentication & Onboarding

### Screen 1: Register / Sign Up
**Step 1:** App calls the Register API.
- **Endpoint:** `POST /api/auth/register` (Public)
- **Request Type:** `application/json`
  - `email` (String, required)
  - `password` (String, required)
  - `username` (String, optional)
  - `name` (String, optional)
- **Request Example:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123",
    "username": "fitness_jane",
    "name": "Jane Doe"
  }
  ```
- **Response Type:** `application/json` (201 Created)
  - `access_token` (String)
  - `refresh_token` (String)
  - `user` (Object): `id` (String), `email` (String), `username` (String), `name` (String), `role` (String)
- **Response Example:**
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

### Screen 2: Login
**Step 1:** App calls the Login API.
- **Endpoint:** `POST /api/auth/login` (Public)
- **Request Type:** `application/json`
  - `email` (String, required)
  - `password` (String, required)
- **Request Example:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```
- **Response Type:** `application/json` (200 OK)
  - *Identical to the Register response format above.*

### Screen 3: Forgot Password Flow
**Step 1: Request OTP**
- **Endpoint:** `POST /api/auth/forgot-password` (Public)
- **Request:** `{ "email": "user@example.com" }`
- **Response:** `{ "success": true, "message": "OTP sent successfully to your email" }`

**Step 2: Verify OTP**
- **Endpoint:** `POST /api/auth/verify-otp` (Public)
- **Request:** `{ "email": "user@example.com", "otp": "123456" }` (Note: `otp` is passed as a string).
- **Response Type:** `application/json` (200 OK)
  - `success` (Boolean)
  - `message` (String)
  - `resetToken` (String) - *Valid for 15 minutes.*
- **Response Example:**
  ```json
  {
    "success": true,
    "message": "OTP verified successfully",
    "resetToken": "temp_jwt_token_here"
  }
  ```

**Step 3: Reset Password**
- **Endpoint:** `POST /api/auth/reset-password` (Public)
- **Request Example:**
  ```json
  {
    "resetToken": "temp_jwt_token_here",
    "newPassword": "newsecurepassword456"
  }
  ```
- **Response Example:** `{ "success": true, "message": "Password reset successfully" }`

### Screen 4: Onboarding (Data Collection)
**Step 1: Fetch Dropdown Options** (When screen loads)
- **Endpoint:** `GET /api/onboarding/options` (Public)
- **Response Type:** `application/json` (200 OK)
  - `success` (Boolean)
  - `data` (Object): Contains arrays of objects for `goals`, `symptoms`, `contraceptions`, `dailyCheckIns`.
- **Response Example:**
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
      ]
    }
  }
  ```

**Step 2: Save Profile Data**
- **Endpoint:** `POST /api/profile` (Requires Auth)
- **Request Type:** `application/json`
  - `height_cm` (Number, optional)
  - `weight_kg` (Number, optional)
  - `fitness_level` (String, optional)
  - `goal` (String, optional)
- **Request Example:**
  ```json
  {
    "height_cm": 165,
    "weight_kg": 60.5,
    "fitness_level": "Intermediate",
    "goal": "Build Muscle"
  }
  ```
- **Response Type:** `application/json` (201 Created)
- **Response Example:**
  ```json
  {
    "id": "uuid-profile",
    "created_by": "user@example.com",
    "height_cm": 165,
    "weight_kg": 60.5,
    "fitness_level": "Intermediate",
    "goal": "Build Muscle",
    "createdAt": "2023-10-01T12:00:00Z",
    "updatedAt": "2023-10-01T12:00:00Z"
  }
  ```

---

## 📱 Phase 2: Main Dashboard & Cycle Tracking

### Screen 5: Home / Dashboard
**Step 1: Fetch Cycle Data** 
- **Endpoint:** `GET /api/cycle/cycle-data` (Requires Auth)
- **Response Type:** `Array of Objects` (200 OK)
  - `id` (String)
  - `startDate` (DateTime string)
  - `endDate` (DateTime string, nullable)
  - `cycleLength` (Number, nullable)
  - `periodLength` (Number, nullable)
- **Response Example:**
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

**Step 2: Fetch Notifications Bell**
- **Endpoint:** `GET /api/notification` (Requires Auth)
- **Response Type:** `Array of Objects` (200 OK)
- **Response Example:**
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

### Screen 6: Log Daily Info & Symptoms
**Step 1: Save Daily Flow/Mood**
- **Endpoint:** `POST /api/cycle/daily-logs` (Requires Auth)
- **Request Type:** `application/json`
  - `date` (String YYYY-MM-DD, required)
  - `flowLevel` (String, optional)
  - `notes` (String, optional)
- **Request Example:**
  ```json
  {
    "date": "2023-10-15T00:00:00Z",
    "flowLevel": "Medium",
    "notes": "Feeling great!"
  }
  ```
- **Response Example:** Returns the created `dailyLog` object.

**Step 2: Save Symptoms**
- **Endpoint:** `POST /api/cycle/symptom-logs` (Requires Auth)
- **Request Type:** `application/json`
  - `date` (String YYYY-MM-DD, required)
  - `symptoms` (Array of Strings, required)
  - `severity` (Number, required)
- **Request Example:**
  ```json
  {
    "date": "2023-10-15T00:00:00Z",
    "symptoms": ["headache", "bloating"],
    "severity": 3
  }
  ```
- **Response Example:** Returns the created `symptomLog` object.

---

## 📱 Phase 3: Workouts & Fitness

### Screen 7: Workout Library & Active Session
**Step 1: Start a Workout Session**
- **Endpoint:** `POST /api/workout/workout-sessions` (Requires Auth)
- **Request Type:** `application/json`
  - `workout_name` (String, required)
  - `duration_minutes` (Number, optional, default 0)
  - `completed` (Boolean, optional, default false)
- **Request Example:**
  ```json
  {
    "workout_name": "Full Body Strength",
    "duration_minutes": 0,
    "completed": false
  }
  ```
- **Response Example:**
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

**Step 2: Finish Workout Session**
- **Endpoint:** `PUT /api/workout/workout-sessions/<session_id>` (Requires Auth)
- **Request Type:** `application/json`
- **Request Example:**
  ```json
  {
    "duration_minutes": 45,
    "completed": true
  }
  ```
*(Note: Setting `completed: true` triggers a backend notification push automatically).*
- **Response Example:** Returns the updated session object.

### Screen 8: Personal Records (PRs)
**Step 1: Log a New Heavy Lift**
- **Endpoint:** `POST /api/workout/personal-records` (Requires Auth)
- **Request Type:** `application/json`
  - `exercise_name` (String, required)
  - `weight_kg` (Number, required)
  - `reps` (Number, required)
- **Request Example:**
  ```json
  {
    "exercise_name": "Squat",
    "weight_kg": 80,
    "reps": 5
  }
  ```
- **Response Type:** `application/json` (201 Created). Server automatically injects the calculated `one_rep_max`.
- **Response Example:**
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

---

## 📱 Phase 4: Community Forum

### Screen 9: Community Feed
**Step 1: Fetch Posts**
- **Endpoint:** `GET /api/community/posts?limit=20` (Optional Auth)
- **Response Type:** `Array of Objects` (200 OK)
- **Response Example:**
  ```json
  [
    {
      "id": "uuid-post-1",
      "created_by": "user@example.com",
      "content": "Just hit a new PR!",
      "category": "Fitness",
      "image_url": "http://server/uploads/image.jpg",
      "likes": 12,
      "createdAt": "2023-10-15T12:00:00.000Z",
      "comments": [
         {
           "id": "uuid-comment-1",
           "created_by": "friend@example.com",
           "content": "Amazing job!",
           "createdAt": "2023-10-15T12:05:00.000Z"
         }
      ]
    }
  ]
  ```

**Step 2: Create a Post with Image**
- **Step 2A (Upload Image):** 
  - **Endpoint:** `POST /api/integration/files/upload`
  - **Request Type:** `multipart/form-data`
  - **Field:** `file` (Binary Image Data)
  - **Response Example:** `{ "file_url": "http://server.com/uploads/file.jpg" }`

- **Step 2B (Create Post):**
  - **Endpoint:** `POST /api/community/posts` (Requires Auth)
  - **Request Type:** `application/json`
  - **Request Example:**
    ```json
    {
      "content": "Just hit a new PR!",
      "category": "Fitness",
      "image_url": "http://server.com/uploads/file.jpg"
    }
    ```

### Screen 10: Post Details & Comments
**Step 1: Add Comment**
- **Endpoint:** `POST /api/community/comments` (Requires Auth)
- **Request Type:** `application/json`
- **Request Example:**
  ```json
  {
    "post_id": "uuid-post-1",
    "content": "Awesome job!"
  }
  ```
- **Response Example:** Returns the created comment object.

**Step 2: Like a Post**
- **Endpoint:** `PUT /api/community/posts/<post_id>` (Requires Auth)
- **Request Type:** `application/json`
- **Request Example:**
  ```json
  {
    "likes": 13
  }
  ```

---

## 📱 Phase 5: Settings & Profile

### Screen 11: Settings Dashboard
**Step 1: Fetch User Details**
- **Endpoint:** `GET /api/auth/me` (Requires Auth)
- **Response Example:**
  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jane Doe",
    "username": "fitness_jane",
    "role": "user"
  }
  ```

**Step 2: Update Name or Details**
- **Endpoint:** `PUT /api/auth/me` (Requires Auth)
- **Request Type:** `application/json`
- **Request Example:**
  ```json
  {
    "name": "Jane Updated",
    "username": "jane_updated"
  }
  ```

**Step 3: Change Password**
- **Endpoint:** `POST /api/auth/change-password` (Requires Auth)
- **Request Type:** `application/json`
- **Request Example:**
  ```json
  {
    "currentPassword": "oldpassword123",
    "newPassword": "newpassword456"
  }
  ```
- **Response Example:** `{ "success": true, "message": "Password updated successfully" }`

---

## 📱 Phase 6: Premium / Subscriptions

### Screen 12: Paywall
**Step 1: Verify Apple App Store Purchase** (iOS)
- **Endpoint:** `POST /api/integration/iap/verify-apple` (Requires Auth)
- **Request Type:** `application/json`
  - `receiptData` (String, required)
- **Request Example:**
  ```json
  {
    "receiptData": "base64_encoded_receipt_string_from_apple"
  }
  ```
- **Response Type:** `application/json` (200 OK)
  - `valid` (Boolean)
  - `isPremium` (Boolean)
  - `expiresDate` (String)
  - `productId` (String)
- **Response Example:**
  ```json
  {
    "valid": true,
    "isPremium": true,
    "expiresDate": "2023-11-15 12:00:00 Etc/GMT",
    "productId": "com.herwellness.monthly"
  }
  ```

**Step 2: Verify Google Play Purchase** (Android)
- **Endpoint:** `POST /api/integration/iap/verify-google` (Requires Auth)
- **Request Type:** `application/json`
  - `packageName` (String, required)
  - `productId` (String, required)
  - `token` (String, required)
- **Request Example:**
  ```json
  {
    "packageName": "com.herwellness.app",
    "productId": "monthly_sub",
    "token": "purchase_token_from_google_billing"
  }
  ```
- **Response Type:** `application/json` (200 OK)
- **Response Example:**
  ```json
  {
    "valid": true,
    "expiresDate": "2023-11-15T12:00:00.000Z",
    "productId": "monthly_sub"
  }
  ```
