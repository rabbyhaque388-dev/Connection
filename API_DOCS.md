# COnnection API Documentation

> Base URL (development): `http://localhost:5000/api`
> All protected routes require `Authorization: Bearer <JWT>` header.

---

## Authentication — `/api/auth`

> Rate Limited: 20 requests / 15 min per IP

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register a new user |
| POST | `/auth/login` | ❌ | Login with email/password |
| POST | `/auth/firebase` | ❌ | Login / register via Firebase token |
| POST | `/auth/logout` | ✅ | Invalidate session / clear cookie |
| GET | `/auth/me` | ✅ | Get current authenticated user |

### POST `/auth/register`
```json
// Request
{ "name": "Alice", "email": "alice@ex.com", "password": "Secret123", "age": 25, "gender": "female" }

// 201 Response
{ "success": true, "token": "<jwt>", "user": { "_id": "...", "name": "Alice", ... } }
```

### POST `/auth/login`
```json
// Request
{ "email": "alice@ex.com", "password": "Secret123" }

// 200 Response
{ "success": true, "token": "<jwt>", "user": { ... } }
```

### POST `/auth/firebase`
```json
// Request
{ "firebaseToken": "<firebase-id-token>" }

// 200 Response
{ "success": true, "token": "<jwt>", "user": { ... } }
```

---

## Users — `/api/users`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/discovery` | ✅ | Get discovery feed (excludes self + already-swiped) |
| PUT | `/users/profile` | ✅ | Update profile fields |
| POST | `/users/photos` | ✅ | Upload a profile photo (multipart/form-data) |
| DELETE | `/users/photos/:photoId` | ✅ | Delete a profile photo |
| PUT | `/users/privacy` | ✅ | Toggle showInDiscovery flag |
| PUT | `/users/password` | ✅ | Change account password |
| DELETE | `/users/account` | ✅ | Delete account + all associated data |

### GET `/users/discovery`
```json
// 200 Response
{
  "success": true,
  "feed": [
    { "_id": "...", "name": "Bob", "age": 28, "bio": "...", "photos": [...], "interests": [...] }
  ]
}
```

### PUT `/users/profile`
```json
// Request
{ "name": "Alice", "age": 26, "bio": "Love hiking", "location": "NYC", "interests": ["hiking", "coffee"] }

// 200 Response
{ "success": true, "user": { ... } }
```

### POST `/users/photos`
```
Content-Type: multipart/form-data
Body: photo (file field)

// 201 Response
{ "success": true, "photo": { "_id": "...", "url": "/uploads/xyz.jpg" } }
```

### PUT `/users/privacy`
```json
// Request
{ "showInDiscovery": false }

// 200 Response
{ "success": true }
```

### PUT `/users/password`
```json
// Request
{ "currentPassword": "OldPass", "newPassword": "NewPass123" }

// 200 Response
{ "success": true, "message": "Password updated" }
```

---

## Swipes — `/api/swipes`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/swipes` | ✅ | Record a swipe (like or dislike) |

### POST `/swipes`
```json
// Request
{ "swipedUserId": "<userId>", "type": "like" }  // type: "like" | "dislike"

// 200 Response (no match)
{ "success": true, "match": false }

// 200 Response (mutual match!)
{
  "success": true,
  "match": true,
  "matchDetails": {
    "matchId": "<matchId>",
    "partner": { "_id": "...", "name": "Bob", "photos": [...] }
  }
}
```

---

## Matches — `/api/matches`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/matches` | ✅ | Get all matches for current user |
| DELETE | `/matches/:matchId` | ✅ | Unmatch (deletes match + messages) |

### GET `/matches`
```json
// 200 Response
{
  "success": true,
  "matches": [
    {
      "_id": "<matchId>",
      "partner": { "_id": "...", "name": "Bob", "photos": [...] },
      "lastMessage": { "text": "Hey!", "createdAt": "..." },
      "createdAt": "..."
    }
  ]
}
```

---

## Messages — `/api/messages`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/messages/:matchId` | ✅ | Get message history for a match room |
| POST | `/messages/:matchId` | ✅ | Send a message (REST fallback, supports image) |

### GET `/messages/:matchId`
```json
// 200 Response
{
  "success": true,
  "messages": [
    { "_id": "...", "sender": "<userId>", "text": "Hello!", "image": "", "seen": true, "createdAt": "..." }
  ]
}
```

### POST `/messages/:matchId`
```
Content-Type: multipart/form-data
Body: text (string), image (file, optional)

// 201 Response
{ "success": true, "message": { "_id": "...", "text": "Hi", "image": "/uploads/...", ... } }
```

---

## Notifications — `/api/notifications`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | ✅ | Get all notifications (latest 50) |
| PUT | `/notifications/read-all` | ✅ | Mark all notifications as read |
| PUT | `/notifications/:id/read` | ✅ | Mark single notification as read |
| DELETE | `/notifications/:id` | ✅ | Delete a notification |

### GET `/notifications`
```json
// 200 Response
{
  "success": true,
  "notifications": [
    {
      "_id": "...",
      "type": "match",        // "match" | "message"
      "sender": { "_id": "...", "name": "Bob", "photos": [...] },
      "read": false,
      "createdAt": "..."
    }
  ]
}
```

---

## Socket.io Events

> Connect to: `http://localhost:5000`
> Auth: `{ auth: { token: "<jwt>" } }`

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_match_room` | `{ matchId }` | Join a chat room |
| `send_message` | `{ matchId, text, image }` | Send a real-time message |
| `typing_status` | `{ matchId, isTyping: bool }` | Broadcast typing state |
| `message_seen` | `{ matchId }` | Mark messages as seen |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `receive_message` | `{ _id, matchId, sender, text, image, createdAt }` | New incoming message |
| `typing_status` | `{ senderId, isTyping: bool }` | Partner typing indicator |
| `message_seen` | `{ matchId }` | Partner has read messages |
| `partner_status_change` | `{ userId, isOnline: bool }` | Online/offline presence update |

---

## Error Response Format

All errors follow this consistent shape:

```json
{ "success": false, "message": "Human-readable error description" }
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (no permission) |
| 404 | Resource Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |
