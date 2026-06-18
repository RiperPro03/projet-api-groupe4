import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware";
import { createForwardHandler } from "../utils/http-client";

const router = Router();
const forwardMediaRequest = createForwardHandler("media");

router.all("/health", forwardMediaRequest);
router.all("/health/db", forwardMediaRequest);
router.use(authMiddleware);
router.use(forwardMediaRequest);

export default router;
