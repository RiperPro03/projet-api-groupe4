import { Router } from "express";

import { registerController } from "../controllers/register.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createForwardHandler } from "../utils/http-client";

const router = Router();
const forwardAuthRequest = createForwardHandler("auth");

router.all("/health", forwardAuthRequest);
router.all("/health/db", forwardAuthRequest);
router.all("/login", forwardAuthRequest);
router.post("/register", registerController);
router.all("/refresh-token", forwardAuthRequest);
router.use(authMiddleware);
router.use(forwardAuthRequest);

export default router;
