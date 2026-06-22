# Screen: Paywall / Subscription Upgrade

**Authentication Required:** `Authorization: Bearer <access_token>`

## Step 1: Verify Apple App Store Purchase (iOS)
After the user completes the purchase using the native iOS sheet, take the raw receipt data and send it to the backend.

- **Endpoint:** `POST /api/integration/iap/verify-apple`
- **Request Type:** `application/json`
  - `receiptData` (String, required)

**Request Example:**
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

**Response Example:**
```json
{
  "valid": true,
  "isPremium": true,
  "expiresDate": "2023-11-15 12:00:00 Etc/GMT",
  "productId": "com.herwellness.monthly"
}
```

## Step 2: Verify Google Play Purchase (Android)
After the user completes the purchase using the native Google Play sheet.

- **Endpoint:** `POST /api/integration/iap/verify-google`
- **Request Type:** `application/json`
  - `packageName` (String, required)
  - `productId` (String, required)
  - `token` (String, required)

**Request Example:**
```json
{
  "packageName": "com.herwellness.app",
  "productId": "monthly_sub",
  "token": "purchase_token_from_google_billing"
}
```

- **Response Type:** `application/json` (200 OK)
  - `valid` (Boolean)
  - `expiresDate` (String)
  - `productId` (String)

**Response Example:**
```json
{
  "valid": true,
  "expiresDate": "2023-11-15T12:00:00.000Z",
  "productId": "monthly_sub"
}
```

## Step 3: Handle Success
If the response returns `"valid": true`, unlock the premium features in the Flutter app immediately.
