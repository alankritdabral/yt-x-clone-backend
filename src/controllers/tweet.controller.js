import { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

/* ===========================
   Create Tweet
=========================== */
const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const userId = req.user._id;

  if (!content?.trim()) {
    throw new ApiError(400, "Tweet content is required");
  }

  const tweet = await Tweet.create({
    content: content.trim(),
    owner: userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

/* ===========================
   Get User Tweets
=========================== */
const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  const userExists = await User.exists({ _id: userId });
  if (!userExists) {
    throw new ApiError(404, "User not found");
  }

  const tweets = await Tweet.find({ owner: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalTweets = await Tweet.countDocuments({ owner: userId });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        tweets,
        total: totalTweets,
        page,
        limit,
      },
      "User tweets fetched successfully"
    )
  );
});

/* ===========================
   Update Tweet
=========================== */
const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  if (!content?.trim()) {
    throw new ApiError(400, "Tweet content is required");
  }

  const tweet = await Tweet.findOneAndUpdate(
    {
      _id: tweetId,
      owner: userId,
    },
    {
      content: content.trim(),
    },
    { new: true }
  );

  if (!tweet) {
    throw new ApiError(404, "Tweet not found or you're not the owner");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

/* ===========================
   Delete Tweet
=========================== */
const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  const tweet = await Tweet.findOneAndDelete({
    _id: tweetId,
    owner: userId,
  });

  if (!tweet) {
    throw new ApiError(404, "Tweet not found or you're not the owner");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Tweet deleted successfully"));
});

/* ===========================
   Get Feed Tweets
=========================== */
const getFeedTweets = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  const tweets = await Tweet.find({})
    .populate("owner", "username avatar")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Tweet.countDocuments();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { tweets, total, page, limit },
        "Feed tweets fetched"
      )
    );
});

export { createTweet, getUserTweets, updateTweet, deleteTweet, getFeedTweets };
