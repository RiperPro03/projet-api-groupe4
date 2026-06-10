import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware";
import { createForwardHandler } from "../utils/http-client";

const router = Router();
const forwardUserRequest = createForwardHandler("users");

router.all("/health", forwardUserRequest);
router.all("/health/db", forwardUserRequest);
router.use(authMiddleware);
router.use(forwardUserRequest);

export default router;
