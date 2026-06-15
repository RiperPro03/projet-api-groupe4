import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware";
import { createForwardHandler } from "../utils/http-client";

const router = Router();
const forwardInteractionRequest = createForwardHandler("interactions");

router.all("/posts/:targetId/likes", authMiddleware, forwardInteractionRequest);
router.all("/posts/:targetId/likes/count", authMiddleware, forwardInteractionRequest);

router.all("/comments/:targetId/likes", authMiddleware, forwardInteractionRequest);
router.all("/comments/:targetId/likes/count", authMiddleware, forwardInteractionRequest);

router.all("/replies/:targetId/likes", authMiddleware, forwardInteractionRequest);
router.all("/replies/:targetId/likes/count", authMiddleware, forwardInteractionRequest);

export default router;
