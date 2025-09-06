import mongoose from "mongoose";

// Each message in the chat
const MessageSchema = new mongoose.Schema({
  _id: {
     type: String, required: true 
    },           
  sender: {
     type: mongoose.Schema.Types.ObjectId, ref: "User", required: true
  },
  content: {
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
  },
  isSeen: {
     type: Boolean, default: false 
    },     
  sentAt: {
     type: Date, default: Date.now
  },
});


const PeerchatSchema = new mongoose.Schema({
  chatters: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true } 
  ],
  theme: {
     type: String, default: "light"
  },
  messages: [MessageSchema],
  createdAt: {
     type: Date, default: Date.now
  },
});

export const Peerchat = mongoose.model("Peerchat", PeerchatSchema);
