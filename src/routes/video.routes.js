import { Router } from "express";
import {
  getAllVideos,
  getVideoById,
  publishAVideo,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  registerView,
} from "../controllers/video.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

/* PUBLIC ROUTES */
router.get("/", getAllVideos);
router.get("/:videoId", getVideoById);

/* PRIVATE ROUTES */
router.post(
  "/",
  verifyJWT,
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishAVideo
);

router.patch("/:videoId", verifyJWT, upload.single("thumbnail"), updateVideo);

router.delete("/:videoId", verifyJWT, deleteVideo);

router.patch("/toggle/publish/:videoId", verifyJWT, togglePublishStatus);

router.post("/view/:videoId", verifyJWT, registerView);

export default router;
