import { Router } from "express";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

/* ---------- Public ---------- */
router.get("/:videoId", getVideoComments);

/* ---------- Protected ---------- */
router.post("/:videoId", verifyJWT, addComment);
router.delete("/c/:commentId", verifyJWT, deleteComment);
router.patch("/c/:commentId", verifyJWT, updateComment);

export default router;
