import { Router } from "express";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/user/:userId").get(getUserPlaylists);

/* Create playlist */
router.route("/").post(createPlaylist);

/* Playlist CRUD */
router
  .route("/:playlistId")
  .get(getPlaylistById)
  .patch(updatePlaylist)
  .delete(deletePlaylist);

/* Playlist videos */
router
  .route("/:playlistId/videos/:videoId")
  .patch(addVideoToPlaylist)
  .delete(removeVideoFromPlaylist);

/* User playlists */

export default router;
