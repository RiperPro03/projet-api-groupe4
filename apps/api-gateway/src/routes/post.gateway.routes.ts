import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware";
import { createForwardHandler } from "../utils/http-client";

const router = Router();
const forwardPostRequest = createForwardHandler("posts");

router.all("/health", forwardPostRequest);
router.use(authMiddleware);
router.use(forwardPostRequest);

export default router;
