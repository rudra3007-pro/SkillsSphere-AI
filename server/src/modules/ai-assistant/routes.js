import express from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { aiActionLimiter } from "../../middleware/rateLimiter.js";
import { generateChatResponse } from "./controller.js";

const router = express.Router();

router.post("/", protect, aiActionLimiter, generateChatResponse);

export default router;
