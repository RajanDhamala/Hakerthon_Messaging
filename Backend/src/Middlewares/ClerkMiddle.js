// Middlewares/MvpAuth.js
import asyncHandler from '../Utils/AsyncHandler.js';
import ApiError from '../Utils/ApiError.js';

const mvpAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
console.log("Auth header received:", authHeader);


  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(401,"Missing Authorization header");
  }

  // Extract the user._id from Bearer header
  const userId = authHeader.split(" ")[1];

  if (!userId) {
    throw new ApiError("Invalid Authorization header", 401);
  }

  // Attach userId to the request object
  req.user = userId;
  console.log("Authenticated user:", userId);

  next();
});

export default mvpAuth;
