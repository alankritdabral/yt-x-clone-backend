import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { User } from "../models/user.models.js";
import { refreshAccessToken } from "../controllers/user.controller.js";

export const alreadyLoggedIn = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.accessToken;

  // No token → user not logged in → allow login
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decoded._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      return next();
    }

    req.user = user; // optional but useful
    console.log("User is already logged in:", user.email);
    return next(); // 👈 skip login logic
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return refreshAccessToken(req, res, next);
    }

    return next(); 
  }
});
