import { Router } from "express";

import {
  addCommentLikeHandler,
  addPostLikeHandler,
  countCommentLikesHandler,
  countPostLikesHandler,
  hasCommentLikeHandler,
  hasPostLikeHandler,
  listPostLikersHandler,
  removeCommentLikeHandler,
  removePostLikeHandler,
} from "../controllers/like.controller.js";
import { deletePostInteractionsHandler } from "../controllers/post-interaction-cleanup.controller.js";

const router = Router();

router.post("/posts/likes", addPostLikeHandler);
router.delete("/posts/likes", removePostLikeHandler);
router.get("/posts/likes", listPostLikersHandler);
router.get("/posts/likes/count", countPostLikesHandler);
router.get("/posts/likes/status", hasPostLikeHandler);
router.delete("/posts/:postId/interactions", deletePostInteractionsHandler);

router.post("/comments/likes", addCommentLikeHandler);
router.delete("/comments/likes", removeCommentLikeHandler);
router.get("/comments/likes/count", countCommentLikesHandler);
router.get("/comments/likes/status", hasCommentLikeHandler);

export default router;
