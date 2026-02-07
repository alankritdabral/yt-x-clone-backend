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

/* All playlist routes require login */
router.use(verifyJWT);

/* ---------------------------
   USER PLAYLISTS
---------------------------- */
/* MUST come before :playlistId */
router.get("/user/:userId", getUserPlaylists);

/* ---------------------------
   CREATE PLAYLIST
---------------------------- */
router.post("/", createPlaylist);

/* ---------------------------
   PLAYLIST CRUD
---------------------------- */
router
  .route("/:playlistId")
  .get(getPlaylistById)
  .patch(updatePlaylist)
  .delete(deletePlaylist);

/* ---------------------------
   PLAYLIST VIDEOS
---------------------------- */
router
  .route("/:playlistId/videos/:videoId")
  .patch(addVideoToPlaylist)
  .delete(removeVideoFromPlaylist);

export default router;
