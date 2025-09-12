import { RedisClient } from "../Utils/ConnectRedis.js";
import User from "../Schemas/UserSchema.js";
import GroupChat from "../Schemas/GroupchatSchema.js";

let allSockets = {}; // optional in-memory map if needed
const SocketController = (io) => {
io.on("connection", async (socket) => {
    const { _id, name = "Unknown", publicKey = "" } = socket.handshake.auth;

    if (!_id) {
      socket.emit("unauthorized", { reason: "User ID missing" });
      return socket.disconnect();
    }

    const redisKey = `user:${_id}`;
    const existingUser = await RedisClient.json.get(redisKey);

    // Fetch groups user is part of
    const userGroups = await GroupChat.find({ members: { $in: [_id] } }).select("_id name");
    const groupIds = userGroups.map((g) => g._id.toString());

    // Join all rooms at once
    for (const groupId of groupIds) {
      socket.join(groupId);
    }

    // Store user data in Redis with groups array
    const userData = {
      _id,
      socketId: socket.id,
      name,
      publicKey,
      groups: groupIds
    };

    await RedisClient.json.set(redisKey, "$", userData);
    await RedisClient.sAdd("connectedUsers", _id);

    console.log(`User ${name} joined groups:`, groupIds);

    socket.on("message-request", ({ sender, receiver, messageId, timestamps, encrypted }) => {
      console.log(`Message from ${sender} to ${receiver}: ${JSON.stringify(encrypted)}`);
      io.to(receiver).emit("message-receive", { messageId, timestamps, sender, encrypted });
    });

    socket.on("Is-Typing", async({ isTyping, sender, receiver }) => {
      console.log(`Is-Typing event: sender=${sender}, receiver=${receiver}, isTyping=${isTyping}`);
      const receiverData = await RedisClient.json.get(`user:${receiver}`);
      if (receiverData?.socketId) {
        socket.to(receiverData.socketId).emit("User-Typing", { isTyping, sender, receiver });
      }
    });

  socket.on("Send-peer2peer", async ({ messageId, timestamps, sender, receiver, encrypted, chatId }) => {
  console.log(`Peer2Peer message from ${sender} to ${receiver}: ${JSON.stringify(encrypted)}`);
  console.log(`Chat ID: ${chatId}, Message ID: ${messageId}, Timestamp: ${timestamps} ${encrypted} ${receiver}`);
  const receiverData = await RedisClient.json.get(`user:${receiver}`);
  if (receiverData?.socketId) {
    io.to(receiverData.socketId).emit("Recieve-peer2peer", { 
      messageId, 
      senderId: sender,
      senderName: name, // assuming 'name' is the sender's name
      text: encrypted, 
      chatId,
      timestamp: timestamps,
      type: "text",
      isSeen: false,
      isEdited: false
    });
  }
  });

    socket.on("send-group-message", ({ groupId, messageId, timestamps, receiver, encrynewMessage }) => {
      console.log(`Group message to ${groupId}: ${JSON.stringify(encrynewMessage)}`);
      socket.to(groupId).emit("new-group-message", { groupId, messageId, timestamps, receiver, encrynewMessage, sender: name });
    });

    socket.on("edit-group-message", ({ groupId, messageId, encrynewMessage }) => {
      console.log(`Edit group message in ${groupId}: ${JSON.stringify(encrynewMessage)} ${messageId}`);
      socket.to(groupId).emit("edited-group-message", { groupId, messageId, encrynewMessage, sender: name });
    });

    socket.on("delete-group-message", ({ groupId, messageId }) => {
      socket.to(groupId).emit("deleted-group-message", { groupId, messageId, sender: name });
    });

    socket.on("leave-group", ({ groupId }) => {
      socket.leave(groupId);
      console.log(`User ${_id} left group ${groupId}`);
    });

    socket.on("edit-message", async ({ messageId, encrynewMessage, receiver, chatId }) => {
  const recieverData = await RedisClient.json.get(`user:${receiver}`);
  if (recieverData?.socketId) {
    // Send with the property name frontend expects
    io.to(recieverData.socketId).emit("edited-message", { 
      messageId, 
      newMessage: encrynewMessage, // Changed from 'encrynewMessage' to 'newMessage'
      sender: name, 
      receiver, 
      chatId 
    });
  }
});
   socket.on("delete-message", async ({ messageId, receiver, chatId }) => {
  console.log(`Delete message event for ${messageId} to ${receiver}`);
  const recieverData = await RedisClient.json.get(`user:${receiver}`)
  if (recieverData?.socketId) {
    io.to(recieverData.socketId).emit("deleted-message", { 
      messageId, 
      receiver, 
      chatId, 
      sender: name 
    });
  }
});
    socket.on("call-user", ({ offer, to }) => {
      io.to(to).emit("call-made", { offer, socket: socket.id });
    });

    socket.on("make-answer", ({ answer, to }) => {
      io.to(to).emit("answer-made", { answer, socket: socket.id });
    });

    socket.on("ice-candidate", ({ candidate, to }) => {
      io.to(to).emit("ice-candidate", { candidate, socket: socket.id });
    });

    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const storedUser = await RedisClient.json.get(redisKey);
      if (storedUser?.socketId === socket.id) {
        await RedisClient.del(redisKey);
        await RedisClient.sRem("connectedUsers", _id);
        console.log(`Cleaned up Redis for ${_id}`);
      }
    });
  });
};

const getAllConnectedUsers = async () => {
  const connectedIds = await RedisClient.sMembers("connectedUsers");
  const users = [];

  for (const uid of connectedIds) {
    const userData = await RedisClient.json.get(`user:${uid}`);
    if (userData) {
      users.push({...userData });
    }
  }

  return users;
};

export { SocketController, getAllConnectedUsers };
