import { RedisClient } from "../Utils/ConnectRedis.js";
import User from "../Schemas/UserSchema.js";

let allSockets = {}; // optional in-memory map if needed

const SocketController = (io) => {
io.on("connection", async (socket) => {
  const { _id, name = "Unknown", publicKey = "" } = socket.handshake.auth;

  if (!_id) {
    socket.emit("unauthorized", { reason: "User ID missing" });
    return socket.disconnect();
  }
  // Store user data in Redis
  const redisKey = `user:${_id}`;
  const existingUser = await RedisClient.json.get(redisKey);

  // Override old socket if already connected
  if (existingUser) {
    const oldSocketId = existingUser.socketId;
    const oldSocket = io.sockets.sockets.get(oldSocketId);
    if (oldSocket) {
      oldSocket.emit("duplicate_connection", { reason: "Replaced by new connection" });
    }
  }
  // Store user data with only _id
  const userData = { _id, socketId: socket.id, name, publicKey, friends: {} };
  await RedisClient.json.set(redisKey, "$", userData);

  await RedisClient.sAdd("connectedUsers", _id);

  console.log(`User ${_id} connected and stored in Redis: ${socket.id}`);

  // Emit full user object back to client
  socket.emit("your_socket_id", { users: [userData] });

    socket.on("message-request", ({ sender, receiver, messageId, timestamps, encrypted }) => {
      console.log(`Message from ${sender} to ${receiver}: ${JSON.stringify(encrypted)}`);
      io.to(receiver).emit("message-receive", { messageId, timestamps, sender, encrypted });
    });

    socket.on("Is-Typing", ({ isTyping, sender, group }) => {
      socket.to(group).emit("Group-Typing", { isTyping, sender, group });
    });

    socket.on("Send-peer2peer", async ({ messageId, timestamps, sender, reciever, encrypted }) => {
      const recieverData = await RedisClient.json.get(`user:${reciever}`);
      if (recieverData?.socketId) {
        io.to(recieverData.socketId).emit("Recieve-peer2peer", { messageId, timestamps, sender, encrypted });
      }
    });

    socket.on("send-group-message", ({ groupId, messageId, timestamps, sender, encrynewMessage }) => {
      socket.to(groupId).emit("new-group-message", { groupId, messageId, timestamps, sender, encrynewMessage });
    });

    socket.on("edit-group-message", ({ groupId, messageId, encrynewMessage }) => {
      socket.to(groupId).emit("edited-group-message", { groupId, messageId, encrynewMessage, sender: name });
    });

    socket.on("delete-group-message", ({ groupId, messageId }) => {
      socket.to(groupId).emit("deleted-group-message", { groupId, messageId, sender: name });
    });

    socket.on("leave-group", ({ groupId }) => {
      socket.leave(groupId);
      console.log(`User ${_id} left group ${groupId}`);
    });

    socket.on("edit-message", async ({ messageId, encrynewMessage, receiver }) => {
      const recieverData = await RedisClient.json.get(`user:${receiver}`);
      if (recieverData?.socketId) {
        io.to(recieverData.socketId).emit("edited-message", { messageId, encrynewMessage, sender: name });
      }
    });

    socket.on("delete-message", async ({ messageId, receiver }) => {
      const recieverData = await RedisClient.json.get(`user:${receiver}`);
      if (recieverData?.socketId) {
        io.to(recieverData.socketId).emit("deleted-message", { messageId, receiver, sender: name });
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
