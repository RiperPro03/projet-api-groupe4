import { Router } from "express";

import {
  getAllPostsController,
  getFeedPostsController,
  getPostByIdController,
  getPostsByAuthorController,
  getPostsByTagController,
} from "../controllers/content.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  authenticatedRoles,
  moderationRoles,
  requireBodyOwnerOrRoles,
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
  requireRoles(authenticatedRoles),
  getPostsByAuthorController,
);
router.get("/all", requireRoles(authenticatedRoles), getAllPostsController);
router.get("/feed", requireRoles(authenticatedRoles), getFeedPostsController);
router.get("/tag/:tag", requireRoles(authenticatedRoles), getPostsByTagController);
router.get("/:id", requireRoles(authenticatedRoles), getPostByIdController);
router.post("/", requireBodyOwnerOrRoles({ roles: moderationRoles, ownerBodyField: "authorId" }), forwardPostRequest);
router.patch("/:id", requirePostOwnerOrRoles(moderationRoles), forwardPostRequest);
router.delete("/:id", requirePostOwnerOrRoles(moderationRoles), forwardPostRequest);
router.use(requireRoles(authenticatedRoles));
router.use(forwardPostRequest);

export default router;
