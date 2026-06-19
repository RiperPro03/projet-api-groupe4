import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware";
import {
  adminRoles,
  authenticatedRoles,
  moderationRoles,
  requireRoles,
} from "../middlewares/rbac.middleware";
import { createForwardHandler } from "../utils/http-client";

const router = Router();
const forwardUserRequest = createForwardHandler("users");

router.all("/health", forwardUserRequest);
router.all("/health/db", forwardUserRequest);
router.use(authMiddleware);
router.get("/:id_user", requireRoles(authenticatedRoles), forwardUserRequest);
router.post("/", requireRoles(adminRoles), forwardUserRequest);
router.put("/:id_user", requireRoles(moderationRoles), forwardUserRequest);
router.delete("/:id_user", requireRoles(adminRoles), forwardUserRequest);
router.use(forwardUserRequest);

export default router;
