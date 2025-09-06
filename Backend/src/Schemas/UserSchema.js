import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, required: true 
  },
  email: { 
    type: String, required: true, unique: true 
  },
  avatarUrl: { 
    type: String 
  },
  createdAt: { 
    type: Date, default: Date.now 
  },
  friends: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  ],
  status: { 
    type: String, enum: ["online", "offline", "away"], default: "away" 
  },
  publicKey: { 
    type: String 
  },
  privateKey: { 
    type: String 
  },
  chats: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Peerchat"
    }
  ], // P2P chats
});

UserSchema.index({name: 1 });

export const User = mongoose.model("User", UserSchema);
