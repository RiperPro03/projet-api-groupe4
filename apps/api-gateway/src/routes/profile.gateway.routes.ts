import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware";
import { authenticatedRoles, requireRoles } from "../middlewares/rbac.middleware";
import { createForwardHandler } from "../utils/http-client";

const router = Router();
const forwardProfileRequest = createForwardHandler("profiles");

router.all("/health", forwardProfileRequest);
router.use(authMiddleware);
router.use(requireRoles(authenticatedRoles));
router.use(forwardProfileRequest);

export default router;
