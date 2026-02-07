import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Like } from "../models/like.models.js";
import { View } from "../models/view.models.js";

/* =======================
   GET ALL VIDEOS (PUBLIC)
======================= */
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType } = req.query;

  const pageNum = Math.max(Number(page), 1);
  const limitNum = Math.min(Number(limit), 50);

  const filter = { isPublished: true };

  if (query?.trim()) {
    filter.$or = [
      { title: { $regex: query.trim(), $options: "i" } },
      { description: { $regex: query.trim(), $options: "i" } },
    ];
  }

  const sort = sortBy
    ? { [sortBy]: sortType === "desc" ? -1 : 1 }
    : { createdAt: -1 };

  const videos = await Video.find(filter)
    .populate("owner", "username fullName avatar")
    .sort(sort)
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  const totalVideos = await Video.countDocuments(filter);

  res.status(200).json(
    new ApiResponse(200, {
      videos,
      page: pageNum,
      totalPages: Math.ceil(totalVideos / limitNum),
      totalVideos,
    })
  );
});

/* =======================
   PUBLISH VIDEO (PRIVATE)
======================= */
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title?.trim() || !description?.trim())
    throw new ApiError(400, "Title & description required");

  if (!req.files?.videoFile || !req.files?.thumbnail)
    throw new ApiError(400, "Video & thumbnail required");

  const videoUpload = await uploadOnCloudinary(req.files.videoFile[0].path);
  const thumbnailUpload = await uploadOnCloudinary(req.files.thumbnail[0].path);

  const video = await Video.create({
    title: title.trim(),
    description: description.trim(),
    owner: req.user._id,
    videoFile: videoUpload.secure_url,
    thumbnail: thumbnailUpload.secure_url,
    duration: videoUpload.duration || 0,
    isPublished: true,
  });

  res.status(201).json(new ApiResponse(201, video, "Video published"));
});

/* =======================
   GET VIDEO BY ID (PUBLIC)
======================= */
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");

  const video = await Video.findById(videoId).populate(
    "owner",
    "username fullName avatar"
  );

  if (!video || !video.isPublished) throw new ApiError(404, "Video not found");

  const likesCount = await Like.countDocuments({ video: video._id });

  let isLiked = false;
  if (req.user) {
    const liked = await Like.findOne({
      video: video._id,
      likedBy: req.user._id,
    });
    isLiked = !!liked;
  }

  const result = video.toObject();
  result.likesCount = likesCount;
  result.isLiked = isLiked;

  res.status(200).json(new ApiResponse(200, result, "Video fetched"));
});

/* =======================
   UPDATE VIDEO (PRIVATE)
======================= */
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  if (video.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, "Not authorized");

  const { title, description } = req.body;

  if (title?.trim()) video.title = title.trim();
  if (description?.trim()) video.description = description.trim();

  if (req.file) {
    const thumb = await uploadOnCloudinary(req.file.path);
    video.thumbnail = thumb.secure_url;
  }

  await video.save();

  res.status(200).json(new ApiResponse(200, video, "Video updated"));
});

/* =======================
   DELETE VIDEO (PRIVATE)
======================= */
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) throw new ApiError(400, "Invalid video id");

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  if (video.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, "Not authorized");

  await video.deleteOne();

  res.status(200).json(new ApiResponse(200, null, "Video deleted"));
});

/* =======================
   TOGGLE PUBLISH
======================= */
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);
  if (!video) throw new ApiError(404, "Video not found");

  if (video.owner.toString() !== req.user._id.toString())
    throw new ApiError(403, "Not authorized");

  video.isPublished = !video.isPublished;
  await video.save();

  res.status(200).json(new ApiResponse(200, video, "Publish status toggled"));
});

/* =======================
   REGISTER VIEW
======================= */
const registerView = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  await View.create({
    video: videoId,
    viewer: req.user?._id || null,
    sessionId: req.ip,
  }).catch(() => {});

  await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

  res.status(200).json(new ApiResponse(200, null, "View counted"));
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
