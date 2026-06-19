import { Router } from "express";

import {
  getAllPostsController,
  getFeedPostsController,
  getPostByIdController,
  getPostsByAuthorController,
} from "../controllers/content.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  authenticatedRoles,
  moderationRoles,
  requireOwnerOrRoles,
  requirePostOwnerOrRoles,
  requireRoles,
} from "../middlewares/rbac.middleware";
import { createForwardHandler } from "../utils/http-client";

const router = Router();
const forwardPostRequest = createForwardHandler("posts");

router.all("/health", forwardPostRequest);
router.use(authMiddleware);
router.get(
  "/",
  requireOwnerOrRoles({ roles: moderationRoles, ownerQueryParam: "authorId" }),
  getPostsByAuthorController,
);
router.get("/all", requireRoles(authenticatedRoles), getAllPostsController);
router.get("/feed", requireRoles(authenticatedRoles), getFeedPostsController);
router.get("/:id", requireRoles(authenticatedRoles), getPostByIdController);
router.post("/", requireRoles(authenticatedRoles), forwardPostRequest);
router.patch("/:id", requireRoles(authenticatedRoles), forwardPostRequest);
router.delete("/:id", requirePostOwnerOrRoles(moderationRoles), forwardPostRequest);
router.use(forwardPostRequest);

export default router;
