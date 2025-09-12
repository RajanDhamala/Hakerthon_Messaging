import useSocket from "./Zustand/useSocket";

const socket = useSocket.getState().socket;
const handleDeleteMessage = (msg) => {
  // Implement delete message logic here
    console.log("Delete message:", msg);
    messageId=msg.id;
    sender=msg.senderId;
    chatId=msg.chatId;
    socket.emit("delete-message", { messageId, sender, chatId });
};



export {
    handleDeleteMessage,
    
};