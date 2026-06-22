# Screen: Community Feed

**Authentication Required:** Optional (Users can view without auth, but must auth to post)

## Step 1: Fetch Posts
When the Feed loads, fetch the paginated posts.

- **Endpoint:** `GET /api/community/posts?limit=20`
- **Response Type:** `Array of Objects` (200 OK)

**Response Example:**
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

## Step 2: Create a Post (Text & Image)
If the user attaches an image, you must upload the image first.

**Step 2A (Upload Image):**
- **Endpoint:** `POST /api/integration/files/upload`
- **Request Type:** `multipart/form-data`
  - `file` (Binary Image Data)
- **Response Type:** `application/json` (200 OK)
**Response Example:**
```json
{
  "file_url": "http://server.com/uploads/file.jpg"
}
```

**Step 2B (Create Post):**
- **Endpoint:** `POST /api/community/posts`
- **Request Type:** `application/json`
  - `content` (String, required)
  - `category` (String, optional)
  - `image_url` (String, optional - use URL from Step 2A)

**Request Example:**
```json
{
  "content": "Just hit a new PR!",
  "category": "Fitness",
  "image_url": "http://server.com/uploads/file.jpg"
}
```
- **Response Type:** `application/json` (201 Created)
Returns the created post object.
