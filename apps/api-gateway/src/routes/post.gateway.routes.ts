import { Router } from "express";

import {
  getAllPostsController,
  getFeedPostsController,
  getPostByIdController,
  getPostsByAuthorController,
} from "../controllers/content.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createForwardHandler } from "../utils/http-client";

const router = Router();
const forwardPostRequest = createForwardHandler("posts");

router.all("/health", forwardPostRequest);
router.use(authMiddleware);
router.get("/", getPostsByAuthorController);
router.get("/all", getAllPostsController);
router.get("/feed", getFeedPostsController);
router.get("/tag/:tag", forwardPostRequest);
router.get("/:id", getPostByIdController);
router.use(forwardPostRequest);

export default router;