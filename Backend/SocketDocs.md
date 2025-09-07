# Socket API Documentation

This document provides an overview of all **Socket events** for real-time chat, including event names, payloads, and sample server responses.

---

## Connection

**Event:** `connection`
**Description:** Triggered when a user connects via WebSocket. The server validates and stores the user in Redis.

**Handshake Auth Payload:**
```json
{
  "_id": "user123",
  "name": "John Doe",
  "publicKey": "user-public-key"
}
```

**Server Response:**
```json
{
  "users": [
    {
      "_id": "user123",
      "socketId": "socketId123",
      "name": "John Doe",
      "publicKey": "user-public-key",
      "friends": {}
    }
  ]
}
```

---

## Events

### 1. `message-request`
**Description:** Send a peer-to-peer message request.

**Payload:**
```json
{
  "sender": "user123",
  "receiver": "user456",
  "messageId": "msg001",
  "timestamps": "2025-09-07T08:00:00Z",
  "encrypted": {
    "ciphertext": "encrypted-data",
    "iv": "initialization-vector"
  }
}
```

**Server emits to receiver:** `message-receive`
```json
{
  "messageId": "msg001",
  "timestamps": "2025-09-07T08:00:00Z",
  "sender": "user123",
  "encrypted": {
    "ciphertext": "encrypted-data",
    "iv": "initialization-vector"
  }
}
```

---

### 2. `Is-Typing`
**Description:** Notify group members that a user is typing.

**Payload:**
```json
{
  "isTyping": true,
  "sender": "user123",
  "group": "group123"
}
```

**Server emits to group:** `Group-Typing`
```json
{
  "isTyping": true,
  "sender": "user123",
  "group": "group123"
}
```

---

### 3. `Send-peer2peer`
**Description:** Send an encrypted peer-to-peer message.

**Payload:**
```json
{
  "messageId": "msg002",
  "timestamps": "2025-09-07T08:05:00Z",
  "sender": "user123",
  "reciever": "user456",
  "encrypted": {
    "ciphertext": "encrypted-data",
    "iv": "initialization-vector"
  }
}
```

**Server emits to receiver:** `Recieve-peer2peer`
```json
{
  "messageId": "msg002",
  "timestamps": "2025-09-07T08:05:00Z",
  "sender": "user123",
  "encrypted": {
    "ciphertext": "encrypted-data",
    "iv": "initialization-vector"
  }
}
```

---

### 4. `send-group-message`
**Description:** Send a new message to a group.

**Payload:**
```json
{
  "groupId": "group123",
  "messageId": "msg003",
  "timestamps": "2025-09-07T08:10:00Z",
  "sender": "user123",
  "encrynewMessage": {
    "ciphertext": "encrypted-data",
    "iv": "iv"
  }
}
```

**Server emits to group:** `new-group-message`
```json
{
  "groupId": "group123",
  "messageId": "msg003",
  "timestamps": "2025-09-07T08:10:00Z",
  "sender": "user123",
  "encrynewMessage": {
    "ciphertext": "encrypted-data",
    "iv": "iv"
  }
}
```

---

### 5. `edit-group-message`
**Description:** Notify group members of a message edit.

**Payload:**
```json
{
  "groupId": "group123",
  "messageId": "msg003",
  "encrynewMessage": {
    "ciphertext": "updated-encrypted-data",
    "iv": "iv"
  }
}
```

**Server emits to group:** `edited-group-message`
```json
{
  "groupId": "group123",
  "messageId": "msg003",
  "encrynewMessage": {
    "ciphertext": "updated-encrypted-data",
    "iv": "iv"
  },
  "sender": "John Doe"
}
```

---

### 6. `delete-group-message`
**Description:** Notify group members of a deleted message.

**Payload:**
```json
{
  "groupId": "group123",
  "messageId": "msg003"
}
```

**Server emits to group:** `deleted-group-message`
```json
{
  "groupId": "group123",
  "messageId": "msg003",
  "sender": "John Doe"
}
```

---

### 7. `edit-message` (Peer-to-peer)
**Payload:**
```json
{
  "messageId": "msg002",
  "encrynewMessage": {
    "ciphertext": "updated-encrypted-data",
    "iv": "iv"
  },
  "receiver": "user456"
}
```

**Server emits to receiver:** `edited-message`
```json
{
  "messageId": "msg002",
  "encrynewMessage": {
    "ciphertext": "updated-encrypted-data",
    "iv": "iv"
  },
  "sender": "John Doe"
}
```

---

### 8. `delete-message` (Peer-to-peer)
**Payload:**
```json
{
  "messageId": "msg002",
  "receiver": "user456"
}
```

**Server emits to receiver:** `deleted-message`
```json
{
  "messageId": "msg002",
  "receiver": "user456",
  "sender": "John Doe"
}
```

---

## WebRTC Calls

### 9. `call-user`
**Payload:**
```json
{
  "offer": "RTCSessionDescription",
  "to": "user456"
}
```

**Server emits:** `call-made`
```json
{
  "offer": "RTCSessionDescription",
  "socket": "socket123"
}
```

---

### 10. `make-answer`
**Payload:**
```json
{
  "answer": "RTCSessionDescription",
  "to": "user123"
}
```

**Server emits:** `answer-made`
```json
{
  "answer": "RTCSessionDescription",
  "socket": "socket456"
}
```

---

### 11. `ice-candidate`
**Payload:**
```json
{
  "candidate": "ICECandidate",
  "to": "user456"
}
```

**Server emits:** `ice-candidate`
```json
{
  "candidate": "ICECandidate",
  "socket": "socket123"
}
```

---

## Disconnect

**Event:** `disconnect`
**Description:** Cleans up Redis and connected users on socket disconnect.

**Server log example:**
```
Socket disconnected: socketId123
Cleaned up Redis for user123
```

---
