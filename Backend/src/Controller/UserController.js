import User from "../Schemas/UserSchema.js"
import asyncHandler from "../Utils/AsyncHandler.js"
import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";
import Peerchat from "../Schemas/PeerchatSchema.js";


const CheckUserExists=asyncHandler(async(req,res)=>{
   const { clerkId } = req.params;
   
   if (!clerkId) {
      throw new ApiError("clerkId is required", 400);
   }
   const user = await User.findById(clerkId).select("_id");
   if (!user) {
      return res.send(new ApiResponse(404, "User does not exist"));
   }
   res.status(200).json(new ApiResponse(true, "User exists", user));
})


const RegisterUser=asyncHandler(async(req,res)=>{
   const { clerkId, displayName, avatarUrl, birthDate, gender, email } = req.body;

   if (!clerkId || !email || !displayName) {
   throw new ApiError("clerkId, email, and displayName are required", 400);
   }

   const existingUser = await User.findById(clerkId);
   console.log(existingUser)
   if (existingUser) {
      throw new ApiError(400,"User already exists");
   }

   const newUser = new User({
      _id: clerkId,
      name: displayName,
      email,
      avatarUrl,
      birthDate,
  });
   await newUser.save();
    res.status(201).json(new ApiResponse(true, "User registered successfully", newUser));
})

const sendMessageRequest = asyncHandler(async (req, res) => {
  const { receiverId } = req.params;
  const senderId = req.user;

  if (!senderId || !receiverId) {
    throw new ApiError(400, "userId and receiverId are required");
  }

  const sender = await User.findById(senderId).select("name friends");
  if (!sender) throw new ApiError(404, "Sender not found");

  const receiver = await User.findById(receiverId).select("friends messageRequests");
  if (!receiver) throw new ApiError(404, "Receiver not found");

  if (receiver.friends?.includes(senderId)) {
    throw new ApiError(403, "Already are friends");
  }
  const existingReq = receiver.messageRequests.find(
    (req) => req.from === senderId
  );

  if (existingReq) {
    throw new ApiError(409, "Message request already sent");
  }

  receiver.messageRequests.push({
    from: senderId,
    message: "Hi, let's connect!",
    sentAt: Date.now(),
  });

  await receiver.save();

  res.status(200).json(
    new ApiResponse(true, "Message request sent successfully")
  );
});

// Controller: Search users excluding the current sender
const searchUsers = asyncHandler(async (req, res) => {
  const senderId = req.user;
  if (!senderId) {
    throw new ApiError(400, "user_id is required");
  }

  const { query } = req.query;
  if (!query) {
    throw new ApiError(400, "search query is required");
  }

  // 🔹 Exclude the sender themselves from search results
  const users = await User.find({
    _id: { $ne: senderId }, // exclude logged-in user
    name: { $regex: query, $options: "i" }
  }).select("_id name avatarUrl status");

  res.status(200).json(new ApiResponse(true, "Search results", users));
});



const AcceptMessageRequest = asyncHandler(async (req, res) => {
  const { requestId, type } = req.params;
  const user_id = req.user;

  if (!["accept", "reject"].includes(type)) {
    throw new ApiError(400, "type must be either 'accept' or 'reject'");
  }

  if (!requestId || !user_id) {
    throw new ApiError(400, "requestId and user_id are required");
  }

  // Find the user and the message request
  const user = await User.findOne(
    { _id: user_id, "messageRequests._id": requestId },
    { "messageRequests.$": 1 }
  );
  if (!user) throw new ApiError(404, "Message request not found");

  const senderId = user.messageRequests[0].from;

  if (type === "accept") {
    // 1. Add sender to current user's friends and remove message request
    const updatedUser = await User.findByIdAndUpdate(
      user_id,
      {
        $pull: { messageRequests: { _id: requestId } },
        $addToSet: { friends: senderId },
      },
      { new: true }
    );

    // 2. Add current user to sender's friends
    await User.findByIdAndUpdate(
      senderId,
      { $addToSet: { friends: user_id } },
      { new: true }
    );

    await Peerchat.create({
      chatters: [user_id, senderId],
      messages: [],
    });
    return res.status(200).json(
      new ApiResponse(true, "Message request accepted", updatedUser)
    );
  } else {
    // reject: just remove the message request
    const updatedUser = await User.findByIdAndUpdate(
      user_id,
      { $pull: { messageRequests: { _id: requestId } } },
      { new: true }
    );
    return res.status(200).json(
      new ApiResponse(true, "Message request rejected", updatedUser)
    );
  }
});

const seeMessageRequests=asyncHandler(async(req,res)=>{

    const user_id=req.user;
    if(!user_id){
        throw new ApiError(400,"user_id is required");
    }
    const user=await User.findById(user_id).populate("messageRequests.from","_id name avatarUrl status");
    if(!user){
        throw new ApiError(404,"User not found");
    }
    res.status(200).json(new ApiResponse(true,"Message requests fetched",user.messageRequests));
});


export { RegisterUser, CheckUserExists, sendMessageRequest, searchUsers, AcceptMessageRequest, seeMessageRequests };
