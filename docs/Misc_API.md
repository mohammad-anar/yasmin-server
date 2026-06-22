# Profile, Notification, Integration, and Onboarding APIs

All routes require authentication header: `Authorization: Bearer <access_token>`

## 1. Profile API
- **Get Profile:** `GET /api/profile`
- **Create Profile:** `POST /api/profile` (Body: `height_cm`, `weight_kg`, `fitness_level`, etc.)
- **Update Profile:** `PUT /api/profile` (Updates existing or creates if missing)

## 2. Notification API
- **Get Notifications:** `GET /api/notification` (Returns array of app notifications)
- **Update (Mark Read):** `PUT /api/notification/:id` (Body: `{ "read": true }`)
- **Delete:** `DELETE /api/notification/:id`

## 3. Subscription API
- **Get My Sub:** `GET /api/subscription/me`

## 4. Integration API
- **Upload File:** `POST /api/integration/files/upload` (Multipart form-data, key: `file`. Returns `file_url`)
- **AI Coach:** `POST /api/integration/ai/coach` (Body: `prompt`)
- **Apple IAP:** `POST /api/integration/iap/verify-apple` (Body: `receiptData`)
- **Google IAP:** `POST /api/integration/iap/verify-google` (Body: `packageName`, `productId`, `token`)

## 5. Onboarding API
- **Get Options:** `GET /api/onboarding/options` (Returns goals, symptoms, contraception types for dropdowns). *No auth required.*
