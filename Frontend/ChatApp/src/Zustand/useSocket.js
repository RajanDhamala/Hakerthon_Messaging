import { create } from 'zustand';
import { io } from 'socket.io-client';

const useSocket = create((set, get) => ({
  socket: null,
  socketId: null,
  isConnecting: false,
  VideoCall: null,

  connect: (url,user_id,name,publicKey='') => {
    const { socket, isConnecting } = get();
    if (socket || isConnecting) return;

    set({ isConnecting: true });
    console.log("Attempting to connect to socket server...",publicKey);
    const newSocket = io(url,{
      withCredentials: true,
      reconnection: false,
      reconnectionAttempts: 3,       
      reconnectionDelay: 2000,       
      reconnectionDelayMax: 5000, 
      transports: ['websocket'], 
      auth:{
        _id:user_id,
        publicKey:publicKey,
        name:name || "Unknown"
      }
    });

    newSocket.on('connect', () => {
      set({ socket: newSocket, socketId: newSocket.id, isConnecting: false });
      console.log("Connected:", newSocket.id);
    });

    newSocket.on('disconnect', (reason) => {
      console.log("Disconnected:", reason);
      set({ socket: null, socketId: null, isConnecting: false });
    });

    newSocket.on('connect_error', (err) => {
      console.log("Connect error:", err);
      set({ isConnecting: false });
    });

      newSocket.on("unauthorized", (data) => {
      console.warn("Unauthorized socket connection:", data.reason);
      alert("Unauthorized connection. Please log in again.");
      newSocket.disconnect();
    })

      newSocket.on("connect_error", (err) => {
      console.log("Connect error:", err.message);
      set({ isConnecting: false });
      newSocket.disconnect(); 
    });

  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, socketId: null, isConnecting: false });
    }
  },

  setVideoCall: (videoCall) => set({ VideoCall: videoCall }),
  removeVideoCall: () => set({ VideoCall: null }),
}));

export default useSocket;
