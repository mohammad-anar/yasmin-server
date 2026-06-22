# Screen: Post Details & Comments

**Authentication Required:** `Authorization: Bearer <access_token>` (for commenting and liking)

## Step 1: Add a Comment
When the user types a comment and presses send.

- **Endpoint:** `POST /api/community/comments`
- **Request Type:** `application/json`
  - `post_id` (String, required)
  - `content` (String, required)

**Request Example:**
```json
{
  "post_id": "uuid-post-1",
  "content": "Awesome job!"
}
```

- **Response Type:** `application/json` (201 Created)
Returns the created comment object. Append this to your Flutter list state immediately.

## Step 2: Like a Post
When the user taps the heart icon.

- **Endpoint:** `PUT /api/community/posts/<post_id>`
- **Request Type:** `application/json`
  - `likes` (Number, required)

**Request Example:**
```json
{
  "likes": 13
}
```

- **Response Type:** `application/json` (200 OK)
Returns the updated post object.

## Step 3: Report a Post
When the user taps the 3 dots and selects "Report".

- **Endpoint:** `POST /api/community/reports`
- **Request Type:** `application/json`
  - `post_id` (String, required)
  - `reason` (String, required)

**Request Example:**
```json
{
  "post_id": "uuid-post-1",
  "reason": "Inappropriate Content"
}
```
- **Response Type:** `application/json` (201 Created)
