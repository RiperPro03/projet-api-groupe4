import { Router } from "express";

import {
  addCommentLikeHandler,
  addPostLikeHandler,
  countCommentLikesHandler,
  countPostLikesHandler,
  removeCommentLikeHandler,
  removePostLikeHandler,
} from "../controllers/like.controller.js";

const router = Router();

router.post("/posts/likes", addPostLikeHandler);
router.delete("/posts/likes", removePostLikeHandler);
router.get("/posts/likes/count", countPostLikesHandler);

router.post("/comments/likes", addCommentLikeHandler);
router.delete("/comments/likes", removeCommentLikeHandler);
router.get("/comments/likes/count", countCommentLikesHandler);

export default router;
