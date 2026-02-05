import { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { Video } from "../models/video.models.js";
import { Comment } from "../models/comment.models.js";
import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

/* ===========================
   Toggle Video Like
=========================== */
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const videoExists = await Video.exists({ _id: videoId });
  if (!videoExists) {
    throw new ApiError(404, "Video not found");
  }

  const deleted = await Like.findOneAndDelete({
    likedBy: userId,
    video: videoId,
  });

  const liked = !deleted;

  if (liked) {
    await Like.create({
      likedBy: userId,
      video: videoId,
    });
  }

  const likesCount = await Like.countDocuments({ video: videoId });

  return res.status(200).json(
    new ApiResponse(200, {
      liked,
      likesCount,
    })
  );
});

/* ===========================
   Toggle Comment Like
=========================== */
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  const commentExists = await Comment.exists({ _id: commentId });
  if (!commentExists) {
    throw new ApiError(404, "Comment not found");
  }

  const deleted = await Like.findOneAndDelete({
    likedBy: userId,
    comment: commentId,
  });

  const liked = !deleted;

  if (liked) {
    await Like.create({
      likedBy: userId,
      comment: commentId,
    });
  }

  const likesCount = await Like.countDocuments({
    comment: commentId,
  });

  return res.status(200).json(
    new ApiResponse(200, {
      liked,
      likesCount,
    })
  );
});

/* ===========================
   Toggle Tweet Like
=========================== */
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  const tweetExists = await Tweet.exists({ _id: tweetId });
  if (!tweetExists) {
    throw new ApiError(404, "Tweet not found");
  }

  const deleted = await Like.findOneAndDelete({
    likedBy: userId,
    tweet: tweetId,
  });

  const liked = !deleted;

  if (liked) {
    await Like.create({
      likedBy: userId,
      tweet: tweetId,
    });
  }

  const likesCount = await Like.countDocuments({
    tweet: tweetId,
  });

  return res.status(200).json(
    new ApiResponse(200, {
      liked,
      likesCount,
    })
  );
});

/* ===========================
   Get Liked Videos
=========================== */
const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: userId,
        video: { $ne: null },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
      },
    },
    { $unwind: "$video" },
    {
      $replaceRoot: { newRoot: "$video" },
    },
    { $sort: { createdAt: -1 } },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      likedVideos,
      "Liked videos fetched successfully"
    )
  );
});

export {
  toggleVideoLike,
  toggleCommentLike,
  toggleTweetLike,
  getLikedVideos,
};
