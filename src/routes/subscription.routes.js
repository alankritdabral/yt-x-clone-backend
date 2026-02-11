import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

/* ---------- Public ---------- */
router.get("/c/:channelId", getUserChannelSubscribers);

/* ---------- Protected ---------- */
router.post("/c/:channelId", verifyJWT, toggleSubscription);
router.get("/u/:subscriberId", verifyJWT, getSubscribedChannels);

export default router;
