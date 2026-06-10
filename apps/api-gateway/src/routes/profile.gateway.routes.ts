import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware";
import { createForwardHandler } from "../utils/http-client";

const router = Router();
const forwardProfileRequest = createForwardHandler("profiles");

router.all("/health", forwardProfileRequest);
router.use(authMiddleware);
router.use(forwardProfileRequest);

export default router;
