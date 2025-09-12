import User from "../Schemas/UserSchema.js"
import asyncHandler from "../Utils/AsyncHandler.js"
import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";
import Peerchat from "../Schemas/PeerchatSchema.js";
import Groupchat from "../Schemas/GroupchatSchema.js";


const fetchPeerMessages=asyncHandler(async(req,res)=>{
    const {userId}=req.params;
    if(!userId){
        throw new ApiError(400,"userId is required");
    }

    const chats=await Peerchat.find({
        chatters: { $in: [userId] }
    })
    console.log(chats);
    return res.status(200).json(new ApiResponse(true,"Chats fetched successfully",chats));
})

const sendMessage=asyncHandler(async(req,res)=>{
    const {receiverId,message,senderId}=req.params;
    // const {senderId}=req.user;

    if(!senderId || !receiverId || !message){
        throw new ApiError(400,"userId, receiverId and message are required");
    }
    const messaeges=await Peerchat.findOneAndUpdate(
        { chatters: { $all: [senderId, receiverId] } },
        { $push: { messages: { sender: senderId, content: message } } },
        { new: true }
    );

    if(!messaeges){
        throw new ApiError(404,"Chat not found between the users");
    }
    return res.status(200).json(new ApiResponse(true,"Message sent successfully",messaeges));
})

const DeleteMessage=asyncHandler(async(req,res)=>{
    const {chatId:chat_id,mdgId:messageId}=req.params;
    const {user_id}=req.user;

    if(!chat_id || !messageId){
        throw new ApiError(400,"chat_id and messageId are required");
    }

    const chat=await Peerchat.findById(chat_id);
    if(!chat){
        throw new ApiError(404,"Chat not found");
    }

    const message=chat.messages.id(messageId);
    if(!message){
        throw new ApiError(404,"Message not found");
    }
    
    if(message.sender.toString()!==user_id){
        throw new ApiError(403,"You are not authorized to delete this message");
    }
    message.remove();
    await chat.save();

    return res.status(200).json(new ApiResponse(true,"Message deleted successfully",chat));
})

const EditMessage=asyncHandler(async(req,res)=>{
    const {chat_id,messageId,newMsg}=req.body;
    const {user_id}=req.user;
    
    if(!chat_id || !messageId || !newMsg){
        throw new ApiError(400,"chat_id, messageId and newMsg are required");
    }
    const chat=await Peerchat.findById(chat_id);
    if(!chat){
        throw new ApiError(404,"Chat not found");
    }
    
    const message=chat.messages.id(messageId);
    if(!message){
        throw new ApiError(404,"Message not found");
    }

    if(message.sender.toString()!==user_id){
        throw new ApiError(403,"You are not authorized to edit this message");
    }
    message.content=newMsg;
    await chat.save();
    return res.status(200).json(new ApiResponse(true,"Message edited successfully",chat));
})


// Controller to fetch chats but with a single static message for testing
const fetchCurrentChats = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) throw new ApiError(400, "userId is required");

  let chats = await Peerchat.find({
    chatters: { $in: [userId] },
  })
    .populate("chatters", "_id name avatarUrl publicKey")
    .lean();

  // Replace messages array with one static message for testing
  chats = chats.map(chat => {
    const otherChatters = chat.chatters.filter(
      (chatter) => chatter._id.toString() !== userId
    );

    return {
      ...chat,
      chatters: otherChatters,
      messages: [
        {
          messageId: "msg_static_1",
          senderId: otherChatters[0]?._id || userId,
          senderName: otherChatters[0]?.name || "Test User",
          text: "Hello, this is a static test message!",
          chatId: chat._id,
          timestamp: new Date().toISOString(),
          type: "text",
          isSeen: false,
        }
      ]
    };
  });

  return res
    .status(200)
    .json(new ApiResponse(true, "Chats fetched successfully", chats));
});




export{
    fetchPeerMessages,
    sendMessage,
    DeleteMessage,
    EditMessage,
    fetchCurrentChats,
   
}