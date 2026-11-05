import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { getGuidance, getHistory } from "../controllers/guidanceController.js";

const router = Router();

router.post("/", protect, getGuidance);
router.get("/history", protect, getHistory);

export default router;
