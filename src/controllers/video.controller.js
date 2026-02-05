import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Like } from "../models/like.models.js";
import { View } from "../models/view.models.js";

/* ===========================
   Get All Videos
=========================== */
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType } = req.query;

  const pageNumber = Math.max(Number(page), 1);
  const limitNumber = Math.min(Number(limit), 50);

  const filter = { isPublished: true };

  if (query?.trim()) {
    filter.$or = [
      { title: { $regex: query.trim(), $options: "i" } },
      { description: { $regex: query.trim(), $options: "i" } },
    ];
  }

  // if (userId) {
  //   if (!isValidObjectId(userId)) {
  //     throw new ApiError(400, "Invalid userId");
  //   }
  //   filter.owner = new mongoose.Types.ObjectId(userId);
  // }

  const sort = {};
  if (sortBy) {
    sort[sortBy] = sortType === "desc" ? -1 : 1;
  } else {
    sort.createdAt = -1;
  }

  const videos = await Video.find(filter)
    .populate("owner", "username fullName avatar")
    .sort(sort)
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber);

  const totalVideos = await Video.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        page: pageNumber,
        limit: limitNumber,
        totalVideos,
        totalPages: Math.ceil(totalVideos / limitNumber),
      },
      "Videos fetched successfully"
    )
  );
});

/* ===========================
   Publish Video
=========================== */
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and description are required");
  }

  if (!req.files?.videoFile?.length || !req.files?.thumbnail?.length) {
    throw new ApiError(400, "Video file and thumbnail are required");
  }

  const videoFilePath = req.files.videoFile[0].path;
  const thumbnailPath = req.files.thumbnail[0].path;

  const videoFile = await uploadOnCloudinary(videoFilePath);
  const thumbnail = await uploadOnCloudinary(thumbnailPath);

  if (!videoFile?.secure_url || !thumbnail?.secure_url) {
    throw new ApiError(500, "Cloudinary upload failed");
  }

  const video = await Video.create({
    title: title.trim(),
    description: description.trim(),
    owner: req.user._id,
    isPublished: true,
    videoFile: videoFile.secure_url,
    thumbnail: thumbnail.secure_url,
    duration: videoFile.duration || 0,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully"));
});

/* ===========================
   Get Video By ID
=========================== */
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const video = await Video.findById(videoId).populate(
    "owner",
    "username fullName avatar"
  );

  if (
    !video ||
    (!video.isPublished &&
      video.owner._id.toString() !== req.user._id.toString())
  ) {
    throw new ApiError(404, "Video not found");
  }

  /* ---------- COUNT LIKES ---------- */
  const likesCount = await Like.countDocuments({
    video: video._id,
  });

  /* ---------- CHECK USER LIKE ---------- */
  const userLike = await Like.findOne({
    video: video._id,
    likedBy: req.user._id,
  });

  const responseVideo = video.toObject();
  responseVideo.likesCount = likesCount;
  responseVideo.isLiked = !!userLike;

  return res
    .status(200)
    .json(new ApiResponse(200, responseVideo, "Video fetched successfully"));
});

/* ===========================
   Update Video
=========================== */
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  if (title?.trim()) video.title = title.trim();
  if (description?.trim()) video.description = description.trim();

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

/* ===========================
   Delete Video
=========================== */
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});

/* ===========================
   Toggle Publish Status
=========================== */
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Not authorized");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        video,
        `Video ${video.isPublished ? "published" : "unpublished"} successfully`
      )
    );
});

/* ===========================
   Register View
=========================== */
const registerView = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const sessionId =
    req.cookies?.sessionId || req.headers["x-session-id"] || req.ip;

  const viewer = req.user?._id || null;

  try {
    await View.create({
      video: videoId,
      viewer,
      sessionId,
    });

    await Video.findByIdAndUpdate(videoId, {
      $inc: { views: 1 },
    });
  } catch (err) {
    /* Duplicate view ignored */
  }

  return res.status(200).json(new ApiResponse(200, null, "View counted"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  registerView,
};
