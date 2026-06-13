import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware";
import { createForwardHandler } from "../utils/http-client";

const router = Router();
const forwardFollowRequest = createForwardHandler("follows");

router.all("/health", forwardFollowRequest);
router.use(authMiddleware);
router.use(forwardFollowRequest);

export default router;
