# Community API Documentation

## Posts
- **Create Post (Auth):** `POST /api/community/posts` (Body: `content`, `category`, `image_url`)
- **Get Posts (Optional Auth):** `GET /api/community/posts` (Params: `?category=...&limit=10`)
- **Get Single Post:** `GET /api/community/posts/:id`
- **Update / Like Post (Auth):** `PUT /api/community/posts/:id` (Body: `{ "likes": new_number }` or content update)
- **Delete Post:** `DELETE /api/community/posts/:id`

## Comments
- **Create Comment (Auth):** `POST /api/community/comments` (Body: `post_id`, `content`)
- **Get Comments:** `GET /api/community/comments?post_id=...`
- **Delete Comment:** `DELETE /api/community/comments/:id`

## Reports
- **Report a Post:** `POST /api/community/reports` (Body: `post_id`, `reason`)
