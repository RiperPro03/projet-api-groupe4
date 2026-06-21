import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware";
import { createForwardHandler } from "../utils/http-client";

const router = Router();
const forwardNotificationRequest = createForwardHandler("notifications");

router.all("/health", forwardNotificationRequest);
router.use(authMiddleware);
router.use(forwardNotificationRequest);

export default router;
