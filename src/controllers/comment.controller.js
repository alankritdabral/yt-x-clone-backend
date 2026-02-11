import mongoose from "mongoose";
import { Comment } from "../models/comment.models.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { Video } from "../models/video.models.js";

/* ===========================
   Utils
=========================== */

const getValidVideoId = async (videoIdParam) => {
  if (!videoIdParam) {
    throw new ApiError(400, "videoId is required");
  }

  if (!mongoose.isValidObjectId(videoIdParam)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const videoId = new mongoose.Types.ObjectId(videoIdParam);

  const videoExists = await Video.exists({ _id: videoId });
  if (!videoExists) {
    throw new ApiError(404, "Video not found");
  }

  return videoId;
};

const getValidCommentId = (commentId) => {
  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }
  return new mongoose.Types.ObjectId(commentId);
};

/* ===========================
   Get Video Comments
=========================== */

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId: videoIdParam } = req.params;
  const videoId = await getValidVideoId(videoIdParam);

  const userId = req.user?._id || null;

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  const result = await Comment.aggregate([
    { $match: { video: videoId } },
    {
      $facet: {
        comments: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },

          /* -------- OWNER -------- */
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          { $addFields: { owner: { $first: "$owner" } } },

          /* -------- LIKE COUNT -------- */
          {
            $lookup: {
              from: "likes",
              let: { commentId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$comment", "$$commentId"] },
                  },
                },
                { $count: "count" },
              ],
              as: "likesCountArr",
            },
          },
          {
            $addFields: {
              likesCount: {
                $ifNull: [{ $first: "$likesCountArr.count" }, 0],
              },
            },
          },

          /* -------- USER LIKE -------- */
          ...(userId
            ? [
                {
                  $lookup: {
                    from: "likes",
                    let: { commentId: "$_id" },
                    pipeline: [
                      {
                        $match: {
                          $expr: {
                            $and: [
                              { $eq: ["$comment", "$$commentId"] },
                              { $eq: ["$likedBy", userId] },
                            ],
                          },
                        },
                      },
                      { $limit: 1 },
                    ],
                    as: "userLike",
                  },
                },
                {
                  $addFields: {
                    isLiked: { $gt: [{ $size: "$userLike" }, 0] },
                  },
                },
              ]
            : [{ $addFields: { isLiked: false } }]),

          {
            $project: {
              likesCountArr: 0,
              userLike: 0,
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  const comments = result[0]?.comments || [];
  const total = result[0]?.totalCount[0]?.count || 0;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { comments, total, page, limit },
        "Comments fetched successfully"
      )
    );
});

/* ===========================
   Add Comment
=========================== */

const addComment = asyncHandler(async (req, res) => {
  const { videoId: videoIdParam } = req.params;
  const videoId = await getValidVideoId(videoIdParam);

  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  const comment = await Comment.create({
    content: content.trim(),
    video: videoId,
    owner: req.user._id,
  });

  const populatedComment = await Comment.aggregate([
    { $match: { _id: comment._id } },

    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullname: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    { $addFields: { owner: { $first: "$owner" } } },

    {
      $addFields: {
        likesCount: 0,
        isLiked: false,
      },
    },
  ]);

  return res
    .status(201)
    .json(new ApiResponse(201, populatedComment[0], "Comment added"));
});

/* ===========================
   Update Comment
=========================== */

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const validCommentId = getValidCommentId(commentId);

  const { content } = req.body;

  if (!content?.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  const updatedComment = await Comment.findOneAndUpdate(
    {
      _id: validCommentId,
      owner: req.user._id,
    },
    { content: content.trim() },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(404, "Comment not found or not owned by you");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated"));
});

/* ===========================
   Delete Comment
=========================== */

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const validCommentId = getValidCommentId(commentId);

  const deletedComment = await Comment.findOneAndDelete({
    _id: validCommentId,
    owner: req.user._id,
  });

  if (!deletedComment) {
    throw new ApiError(404, "Comment not found or not owned by you");
  }

  return res.status(200).json(new ApiResponse(200, null, "Comment deleted"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
