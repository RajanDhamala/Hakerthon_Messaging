import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  _id:{
    type: String, required: true
  },
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
    { type: String, ref: "User" }
  ],
  status: { 
    type: String, enum: ["online", "offline", "away"], default: "away" 
  },
  publicKey: { 
    type: String 
    ,default:""
  },
  privateKey: { 
    type: String
    ,default:""
  },
  chats: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Peerchat"
    }
  ], // P2P chats
  messageRequests:[
    {
      from:{
        type: String, ref: "User"
      },
      message:{ type: String ,
        default:"Hi, let's connect!"
      },
      sentAt:{ type: Date, default: Date.now }

    }
  ],groupsChats:[
    { 
      type: mongoose.Schema.Types.ObjectId,
       ref: "Groupchat"
    }
  ] 
});

UserSchema.index({name: 1 });

export const User = mongoose.model("User", UserSchema);


export default User;