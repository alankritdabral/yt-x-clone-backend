import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  updateAccountDetails,
  addToWatchHistory,
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

/* ---------------- PUBLIC ROUTES ---------------- */
router.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);

/* ---------------- SECURED ROUTES ---------------- */
router.use(verifyJWT); // Apply auth middleware below

router.post("/logout", logoutUser);
router.post("/change-password", changeCurrentPassword);
router.get("/current-user", getCurrentUser);
router.patch("/update-account", updateAccountDetails);

router.patch(
  "/avatar",
  upload.single("avatar"),
  updateUserAvatar
);

router.patch(
  "/cover-image",
  upload.single("coverImage"),
  updateUserCoverImage
);

router.get("/c/:username", getUserChannelProfile);
router.get("/history", getWatchHistory);
router.post("/history/:videoId", addToWatchHistory);

export default router;
