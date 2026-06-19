import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware";
import {
  adminRoles,
  authenticatedRoles,
  requireBodyOwnerOrRoles,
  requireParamOwnerOrRoles,
  requireRoles,
} from "../middlewares/rbac.middleware";
import { createForwardHandler } from "../utils/http-client";

const router = Router();
const forwardProfileRequest = createForwardHandler("profiles");

router.all("/health", forwardProfileRequest);
router.use(authMiddleware);
router.post("/", requireBodyOwnerOrRoles({ roles: adminRoles, ownerBodyField: "id_user" }), forwardProfileRequest);
router.put(
  "/:id_user",
  requireParamOwnerOrRoles({ roles: adminRoles, ownerParam: "id_user" }),
  forwardProfileRequest,
);
router.patch(
  "/:id_user",
  requireParamOwnerOrRoles({ roles: adminRoles, ownerParam: "id_user" }),
  forwardProfileRequest,
);
router.delete("/:id_user", requireRoles(adminRoles), forwardProfileRequest);
router.use(requireRoles(authenticatedRoles));
router.use(forwardProfileRequest);

export default router;
