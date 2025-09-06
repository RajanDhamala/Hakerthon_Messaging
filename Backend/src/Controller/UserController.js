import User from "../Schemas/UserSchema.js"
import asyncHandler from "../Utils/AsyncHandler.js"
import ApiError from "../Utils/ApiError.js";
import ApiResponse from "../Utils/ApiResponse.js";

// Create a new user
const RegisterUser=asyncHandler(async(req,res)=>{
   const { clerkId, displayName, avatarUrl, birthDate, gender, email } = req.body;

   if (!clerkId || !email || !displayName) {
   throw new ApiError("clerkId, email, and displayName are required", 400);
   }

   const existingUser = await User.findById(clerkId);
   if (existingUser) {
      throw new ApiError("User already exists", 400);
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






export { RegisterUser };