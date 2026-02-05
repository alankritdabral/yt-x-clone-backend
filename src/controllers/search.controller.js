import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { Tweet } from "../models/tweet.models.js";
import { Playlist } from "../models/playlist.models.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const search = asyncHandler(async (req, res) => {
  const { q, type = "all" } = req.query;

  if (!q) {
    return res.json(new ApiResponse(200, [], "Empty query"));
  }

  const regex = new RegExp(q, "i"); // case-insensitive

  let results = [];

  if (type === "video" || type === "all") {
    const videos = await Video.find({
      $or: [{ title: regex }, { description: regex }],
    }).limit(20);

    results = [...results, ...videos];
  }

  if (type === "user" || type === "all") {
    const users = await User.find({
      username: regex,
    }).limit(10);

    results = [...results, ...users];
  }

  if (type === "tweet" || type === "all") {
    const tweets = await Tweet.find({
      content: regex,
    }).limit(10);

    results = [...results, ...tweets];
  }

  if (type === "playlist" || type === "all") {
    const playlists = await Playlist.find({
      name: regex,
    }).limit(10);

    results = [...results, ...playlists];
  }

  res.json(new ApiResponse(200, results, "Search results"));
});
