import { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.models.js";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

/* ===========================
   Create Playlist
=========================== */
const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name?.trim()) {
    throw new ApiError(400, "Playlist name is required");
  }

  const playlist = await Playlist.create({
    name: name.trim(),
    description: description?.trim() || "",
    owner: req.user._id,
    videos: [],
  });

  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created"));
});

/* ===========================
   Get User Playlists
=========================== */
const getUserPlaylists = asyncHandler(async (req, res) => {
  let { userId } = req.params;

  if (userId === "me") {
    userId = req.user._id;
  }

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  const playlists = await Playlist.find({ owner: userId }).sort({
    createdAt: -1,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "Playlists fetched"));
});

/* ===========================
   Get Playlist By ID
=========================== */
const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid playlistId");

  const playlist = await Playlist.findById(playlistId).populate("videos");

  if (!playlist) throw new ApiError(404, "Playlist not found");

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched"));
});

/* ===========================
   Add Video To Playlist
=========================== */
const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId))
    throw new ApiError(400, "Invalid ids");

  const playlist = await Playlist.findOne({
    _id: playlistId,
    owner: req.user._id,
  });

  if (!playlist) throw new ApiError(404, "Playlist not found or not owner");

  const videoExists = await Video.exists({ _id: videoId });
  if (!videoExists) throw new ApiError(404, "Video not found");

  const alreadyExists = playlist.videos.some((id) => id.toString() === videoId);

  if (alreadyExists) throw new ApiError(400, "Video already in playlist");

  playlist.videos.push(videoId);
  await playlist.save();

  return res.status(200).json(new ApiResponse(200, playlist, "Video added"));
});

/* ===========================
   Remove Video From Playlist
=========================== */
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId))
    throw new ApiError(400, "Invalid ids");

  const playlist = await Playlist.findOne({
    _id: playlistId,
    owner: req.user._id,
  });

  if (!playlist) throw new ApiError(404, "Playlist not found or not owner");

  const before = playlist.videos.length;

  playlist.videos = playlist.videos.filter((id) => id.toString() !== videoId);

  if (before === playlist.videos.length)
    throw new ApiError(404, "Video not in playlist");

  await playlist.save();

  return res.status(200).json(new ApiResponse(200, playlist, "Video removed"));
});

/* ===========================
   Delete Playlist
=========================== */
const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid playlistId");

  const deleted = await Playlist.findOneAndDelete({
    _id: playlistId,
    owner: req.user._id,
  });

  if (!deleted) throw new ApiError(404, "Playlist not found or not owner");

  return res.status(200).json(new ApiResponse(200, null, "Playlist deleted"));
});

/* ===========================
   Update Playlist
=========================== */
const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  if (!isValidObjectId(playlistId))
    throw new ApiError(400, "Invalid playlistId");

  if (!name?.trim() && !description?.trim())
    throw new ApiError(400, "Nothing to update");

  const updated = await Playlist.findOneAndUpdate(
    { _id: playlistId, owner: req.user._id },
    {
      ...(name && { name: name.trim() }),
      ...(description && { description: description.trim() }),
    },
    { new: true }
  );

  if (!updated) throw new ApiError(404, "Playlist not found or not owner");

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Playlist updated"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
