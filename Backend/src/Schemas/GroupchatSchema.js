import mongoose from "mongoose";

const GroupchatSchema = new mongoose.Schema({
    name: { 
        type: String, required: true
     },
    members: [
        { type: String, ref: "User" }
    ],
    messages: [
        {
            sender: { 
                type: String, ref: "User" 
            },
            timestamps: { 
                type: Date, default: Date.now 
            },
            message: {
                 type: String, default: "" 
                },
            messageId: { 
                type: String, required: true
             }
        }
    ],
}, { timestamps: true })

GroupchatSchema.index({ name: 1 });

const GroupChat = mongoose.model("Groupchat", GroupchatSchema);

export default GroupChat;