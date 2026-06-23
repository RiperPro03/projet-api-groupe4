import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware";
import { authenticatedRoles, requireRoles } from "../middlewares/rbac.middleware";
import { createForwardHandler } from "../utils/http-client";

const router = Router();
const forwardMediaRequest = createForwardHandler("media");

router.all("/health", forwardMediaRequest);
router.all("/health/db", forwardMediaRequest);
router.use(authMiddleware);
router.post("/presigned-url", requireRoles(authenticatedRoles), forwardMediaRequest);
router.delete("/:objectKey", requireRoles(authenticatedRoles), forwardMediaRequest);
router.get("/:objectKey", requireRoles(authenticatedRoles), forwardMediaRequest);
router.use(forwardMediaRequest);

export default router;
