import { Router } from "express";
import { register, login, verify2FA } from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify", verify2FA);

export default router;
