# Flutter App API Integration Guide

This guide maps the typical Flutter App screens to the specific backend API endpoints they need to function.

All authenticated requests must include the header:
`Authorization: Bearer <access_token>`

---

## 1. Authentication Screens
**Login Screen**
- Call: `POST /api/auth/login` (Body: `email`, `password`)
- Save the returned `access_token` and `refresh_token` securely (e.g. FlutterSecureStorage).

**Register Screen**
- Call: `POST /api/auth/register` (Body: `email`, `password`, `username`, `name`)

**Forgot Password Flow**
- Call: `POST /api/auth/forgot-password` (Body: `email`) -> Sends OTP
- Call: `POST /api/auth/verify-otp` (Body: `email`, `otp`) -> Returns `resetToken`
- Call: `POST /api/auth/reset-password` (Body: `resetToken`, `newPassword`)

---

## 2. Onboarding Flow
**Dropdown Selections (Goals, Contraception, etc.)**
- Call: `GET /api/onboarding/options` to populate your UI Dropdowns/Lists.

**Save Onboarding Data**
- Call: `POST /api/profile` to save body metrics (`height_cm`, `weight_kg`, `fitness_level`).

---

## 3. Home / Cycle Tracker Dashboard
**Fetch User Cycle Data**
- Call: `GET /api/cycle/cycle-data`

**Log Daily Information & Symptoms**
- Call: `POST /api/cycle/daily-logs` (Body: `date`, `flowLevel`, `notes`)
- Call: `POST /api/cycle/symptom-logs` (Body: `date`, `symptoms`, `severity`)

**Notifications Bell**
- Call: `GET /api/notification` to show recent PRs or milestones.

---

## 4. Workout / Fitness Screens
**Workout Library & Sessions**
- Call: `POST /api/workout/workout-sessions` when starting a workout.
- Call: `PUT /api/workout/workout-sessions/:id` (Body: `completed: true`) when finished.

**Personal Records (PRs)**
- Call: `POST /api/workout/personal-records` when user logs a heavy lift. Server automatically calculates 1RM and pushes a Notification.

---

## 5. Community / Forum Screens
**Feed / Timeline Screen**
- Call: `GET /api/community/posts?limit=20`

**Create Post**
- Call: `POST /api/integration/files/upload` to upload an image first (if attaching media).
- Call: `POST /api/community/posts` to create the text content and attach the `file_url`.

**Post Details & Comments**
- Call: `GET /api/community/posts/:id` (Includes comments)
- Call: `POST /api/community/comments` to add a comment.

---

## 6. Premium / Subscriptions (In-App Purchases)
**After user buys through RevenueCat / native stores:**
- iOS: Call `POST /api/integration/iap/verify-apple` (Body: `receiptData`)
- Android: Call `POST /api/integration/iap/verify-google` (Body: `token`, `productId`)
- App state should update to Premium if `valid: true` is returned.
