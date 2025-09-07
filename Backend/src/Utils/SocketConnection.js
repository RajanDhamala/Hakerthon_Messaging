import { Server } from "socket.io";

let io;

const ConnectSocket = (server) => {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized! Call ConnectSocket(server) first.");
  return io;
};

export { ConnectSocket, getIO };
