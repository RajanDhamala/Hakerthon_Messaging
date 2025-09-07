# Group Chat API Documentation

This document provides an overview of the Group Chat API, including endpoints, request parameters, body, and response structure.

---

## 1. Create Group

| Field    | Type   | Description                  |
|----------|--------|-----------------------------|
| URL      | POST `/api/groups/create` | Create a new group |
| Headers  | Authorization: Bearer token | Required |
| Body     | JSON   | `{ "name": "My New Group" }` |
| Response | 201 OK | Group object with members and initial message |

**Response Example:**
```json
{
  "success": true,
  "message": "Group created successfully",
  "data": {
    "_id": "groupId",
    "name": "My New Group",
    "members": ["userId"],
    "messages": [
      {
        "sender": "userId",
        "message": "Group created",
        "messageId": "timestamp"
      }
    ]
  }
}
```

---

## 2. Fetch Group Members

| Field    | Type   | Description                  |
|----------|--------|-----------------------------|
| URL      | GET `/api/groups/members/:groupId` | Fetch members of a group |
| Params   | groupId (string) | Group ID |
| Headers  | Authorization: Bearer token | Required |
| Response | 200 OK | Group object with members list |

**Response Example:**
```json
{
  "success": true,
  "message": "Group fetched successfully",
  "data": {
    "_id": "groupId",
    "name": "Group Name",
    "members": [
      { "_id": "userId", "name": "User Name", "profilePic": "url" }
    ]
  }
}
```

---

## 3. Fetch Last 10 Group Messages

| Field    | Type   | Description                  |
|----------|--------|-----------------------------|
| URL      | GET `/api/groups/messages/:groupId` | Fetch last 10 messages |
| Params   | groupId (string) | Group ID |
| Headers  | Authorization: Bearer token | Required |
| Response | 200 OK | Group object with last 10 messages |

**Response Example:**
```json
{
  "success": true,
  "message": "Group messages fetched successfully",
  "data": {
    "groupId": "groupId",
    "name": "Group Name",
    "members": [
      { "_id": "userId", "name": "User Name", "profilePic": "url" }
    ],
    "messages": [
      {
        "sender": { "_id": "userId", "name": "User Name", "profilePic": "url" },
        "message": "Hello",
        "messageId": "123456",
        "timestamps": "2025-09-07T09:00:00Z"
      }
    ]
  }
}
```

---

## 4. Send Message in Group

| Field    | Type   | Description                  |
|----------|--------|-----------------------------|
| URL      | POST `/api/groups/send` | Send a new message in a group |
| Headers  | Authorization: Bearer token | Required |
| Body     | JSON   | `{ "groupId": "groupId", "message": "Hello everyone", "messageId": "uniqueId123" }` |
| Response | 200 OK | Updated group object with new message |

---

## 5. Delete Group Message

| Field    | Type   | Description                  |
|----------|--------|-----------------------------|
| URL      | DELETE `/api/groups/delete/:groupId/:msgId` | Delete a group message |
| Params   | groupId (string), msgId (string) | Group ID and Message ID |
| Headers  | Authorization: Bearer token | Required |
| Response | 200 OK | Updated group object without deleted message |

---

## 6. Edit Group Message

| Field    | Type   | Description                  |
|----------|--------|-----------------------------|
| URL      | PUT `/api/groups/edit` | Edit a group message |
| Headers  | Authorization: Bearer token | Required |
| Body     | JSON   | `{ "groupId": "groupId", "msgId": "messageId", "newMsg": "Updated message text" }` |
| Response | 200 OK | Updated group object with edited message |

---

## 7. Fetch Current User’s Group Chats

| Field    | Type   | Description                  |
|----------|--------|-----------------------------|
| URL      | GET `/api/groups/current/:userId` | Fetch current user's groups |
| Params   | userId (string) | User ID |
| Headers  | Authorization: Bearer token | Required |
| Response | 200 OK | List of groups with last message |

**Response Example:**
```json
{
  "success": true,
  "message": "Current group chats fetched successfully",
  "data": [
    {
      "chatId": "groupId",
      "name": "Group Name",
      "members": [
        { "_id": "userId", "name": "User Name", "profilePic": "url" }
      ],
      "lastMessage": {
        "sender": { "_id": "userId", "name": "User Name", "profilePic": "url" },
        "message": "Last message text",
        "messageId": "123456",
        "timestamps": "2025-09-07T09:00:00Z"
      }
    }
  ]
}
```

---

# Peer-to-Peer Chat API Documentation

This document provides an overview of the 1:1 Peer-to-Peer Chat API, including endpoints, request parameters, body, and response structure.

---

## 1. Fetch Peer Messages

| Field      | Type     | Description                      |
|-----------|---------|----------------------------------|
| URL       | GET `/api/chats/peer/:userId` | Fetch all chats for a user |
| Params    | `userId` (string) | User ID |
| Headers   | Authorization: Bearer token | Required |
| Response  | 200 OK  | Array of chat objects with messages |

**Response Example:**
```json
{
  "success": true,
  "message": "Chats fetched successfully",
  "data": [
    {
      "_id": "chatId",
      "chatters": [
        { "_id": "userId", "name": "User Name", "avatarUrl": "url", "publicKey": "..." },
        { "_id": "otherUserId", "name": "Other User", "avatarUrl": "url", "publicKey": "..." }
      ],
      "messages": [
        {
          "_id": "messageId",
          "sender": { "_id": "userId", "name": "User Name", "avatarUrl": "url" },
          "content": { "ciphertext": "encryptedText", "iv": "ivString" },
          "isSeen": false,
          "sentAt": "2025-09-07T09:00:00Z"
        }
      ]
    }
  ]
}
```

---

## 2. Send Peer Message

| Field    | Type   | Description                  |
|----------|--------|-----------------------------|
| URL      | POST `/api/chats/send` | Send a new message |
| Headers  | Authorization: Bearer token | Required |
| Body     | JSON   | `{ "receiverId": "otherUserId", "message": { "ciphertext": "encText", "iv": "ivString" }, "chat_id": "chatId", "messageId": "uniqueId123" }` |
| Response | 200 OK | Updated chat object with new message |

---

## 3. Delete Message

| Field    | Type   | Description                  |
|----------|--------|-----------------------------|
| URL      | DELETE `/api/chats/delete/:chatId/:msgId` | Delete a message in a chat |
| Params   | chatId (string), msgId (string) | Chat ID and Message ID |
| Headers  | Authorization: Bearer token | Required |
| Response | 200 OK | Updated chat object without deleted message |

---

## 4. Edit Message

| Field    | Type   | Description                  |
|----------|--------|-----------------------------|
| URL      | PUT `/api/chats/edit` | Edit a message in a chat |
| Headers  | Authorization: Bearer token | Required |
| Body     | JSON   | `{ "chat_id": "chatId", "messageId": "msgId", "newMsg": { "ciphertext": "newEncText", "iv": "newIv" } }` |
| Response | 200 OK | Updated chat object with edited message |

---

## 5. Fetch Current User’s Chats

| Field    | Type   | Description                  |
|----------|--------|-----------------------------|
| URL      | GET `/api/chats/current/:userId` | Fetch all chats of a user |
| Params   | userId (string) | User ID |
| Headers  | Authorization: Bearer token | Required |
| Response | 200 OK | Array of chat objects with last message |

**Response Example:**
```json
{
  "success": true,
  "message": "Chats fetched successfully",
  "data": [
    {
      "_id": "chatId",
      "chatters": [
        { "_id": "userId", "name": "User Name", "avatarUrl": "url", "publicKey": "..." },
        { "_id": "otherUserId", "name": "Other User", "avatarUrl": "url", "publicKey": "..." }
      ],
      "messages": [
        {
          "_id": "messageId",
          "sender": { "_id": "userId", "name": "User Name", "avatarUrl": "url" },
          "content": { "ciphertext": "encryptedText", "iv": "ivString" },
          "isSeen": false,
          "sentAt": "2025-09-07T09:00:00Z"
        }
      ]
    }
  ]
}
```

---

# User API Documentation

This document provides an overview of all **User-related API endpoints** including registration, checking existence, searching, and message requests.

---

## 1. Register User

| Field      | Type     | Description                  |
|-----------|---------|------------------------------|
| URL       | POST `/api/users/register` | Register a new user |
| Body      | JSON    | `{ "clerkId": "string", "displayName": "string", "avatarUrl": "string", "birthDate": "YYYY-MM-DD", "gender": "string", "email": "string" }` |
| Response  | 201 Created | Returns the created user object |

**Response Example:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "clerkId",
    "name": "displayName",
    "email": "email",
    "avatarUrl": "url",
    "birthDate": "2025-09-07",
    "friends": [],
    "status": "away",
    "chats": [],
    "groupsChats": [],
    "messageRequests": []
  }
}
```

---

## 2. Check if User Exists

| Field    | Type   | Description                  |
|----------|--------|-----------------------------|
| URL      | GET `/api/users/exists/:clerkId` | Check if user exists |
| Params   | clerkId (string) | User's clerk ID |
| Response | 200 OK / 404 Not Found | Returns user info if exists, otherwise 404 |

**Response Example (Exists):**
```json
{
  "success": true,
  "message": "User exists",
  "data": { "_id": "clerkId" }
}
```

**Response Example (Not Exists):**
```json
{
  "success": false,
  "message": "User does not exist",
  "data": null
}
```

---

## 3. Search Users

| Field    | Type   | Description                  |
|----------|--------|-----------------------------|
| URL      | GET `/api/users/search?query=xyz` | Search users by name |
| Query    | query (string) | Search keyword |
| Headers  | Authorization: Bearer token | Required |
| Response | 200 OK | Returns array of matching users |

**Response Example:**
```json
{
  "success": true,
  "message": "Search results",
  "data": [
    { "_id": "userId1", "name": "User One", "avatarUrl": "url", "status": "online" },
    { "_id": "userId2", "name": "User Two", "avatarUrl": "url", "status": "offline" }
  ]
}
```

---

## 4. Send Message Request

| Field    | Type   | Description                  |
|----------|--------|-----------------------------|
| URL      | PUT `/api/users/msg-req/:receiverId` | Send a message request to another user |
| Params   | receiverId (string) | User ID of receiver |
| Headers  | Authorization: Bearer token | Required |
| Response | 200 OK | Success message |

**Response Example:**
```json
{
  "success": true,
  "message": "Message request sent successfully",
  "data": null
}
```

---

## 5. Accept or Reject Message Request

| Field    | Type   | Description                  |
|----------|--------|-----------------------------|
| URL      | PUT `/api/users/:type/:requestId` | Accept or reject a message request |
| Params   | type (accept/reject), requestId (string) | Action type and request ID |
| Headers  | Authorization: Bearer token | Required |
| Response | 200 OK | Updated user object |

**Response Example (Accept):**
```json
{
  "success": true,
  "message": "Message request accepted",
  "data": {
    "_id": "currentUserId",
    "friends": ["senderId"],
    "messageRequests": []
  }
}
```

**Response Example (Reject):**
```json
{
  "success": true,
  "message": "Message request rejected",
  "data": {
    "_id": "currentUserId",
    "friends": [],
    "messageRequests": []
  }
}
```

---

## 6. See Message Requests

| Field    | Type   | Description                  |
|----------|--------|-----------------------------|
| URL      | GET `/api/users/msg-reqs` | Fetch all pending message requests |
| Headers  | Authorization: Bearer token | Required |
| Response | 200 OK | Array of pending message requests |

**Response Example:**
```json
{
  "success": true,
  "message": "Message requests fetched",
  "data": [
    { "_id": "reqId1", "from": { "_id": "senderId", "name": "User Name", "avatarUrl": "url", "status": "online" }, "message": "Hi, let's connect!", "sentAt": "2025-09-07T09:00:00Z" }
  ]
}
```

---

## 7. Get All Connected Users (Sockets)

| Field    | Type   | Description                  |
|----------|--------|-----------------------------|
| URL      | GET `/api/users/all-sockets` | Get all currently connected users (via WebSocket) |
| Headers  | Authorization: Bearer token | Optional |
| Response | 200 OK | Array of connected users |

**Response Example:**
```json
{
  "users": [
    { "_id": "userId1", "name": "User One", "avatarUrl": "url", "status": "online" },
    { "_id": "userId2", "name": "User Two", "avatarUrl": "url", "status": "offline" }
  ]
}
```

---

### Notes

- All endpoints (except register and exists) require Authorization header.
- Responses follow this general structure:
  ```json
  {
    "success": boolean,
    "message": string,
    "data": object|array|null
  }
  ```

---
