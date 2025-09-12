import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { ConnectSocket } from "./src/Utils/SocketConnection.js";
import ChatRoute from "./src/Routes/ChatRoute.js";
import UserRoute from "./src/Routes/UserRoute.js";
import {SocketController} from "./src/Controller/SocketController.js";
import GroupRoute from "./src/Routes/GroupRoute.js";




dotenv.config();

const app = express();
const server = http.createServer(app); 
const io = ConnectSocket(server);
SocketController(io);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/chat", ChatRoute);
app.use("/user", UserRoute);
app.use("/group", GroupRoute);

// Test route
app.get("/", (req, res) => {
  res.send("Backend running with Socket.io!");
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;