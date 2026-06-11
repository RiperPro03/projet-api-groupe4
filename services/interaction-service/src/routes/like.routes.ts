import { Router } from "express";

import {
  addCommentLikeHandler,
  addPostLikeHandler,
  addReplyLikeHandler,
  countCommentLikesHandler,
  countPostLikesHandler,
  countReplyLikesHandler,
  removeCommentLikeHandler,
  removePostLikeHandler,
  removeReplyLikeHandler,
} from "../controllers/like.controller.js";

const router = Router();

router.post("/posts/:targetId/likes", addPostLikeHandler);
router.delete("/posts/:targetId/likes", removePostLikeHandler);
router.get("/posts/:targetId/likes/count", countPostLikesHandler);

router.post("/comments/:targetId/likes", addCommentLikeHandler);
router.delete("/comments/:targetId/likes", removeCommentLikeHandler);
router.get("/comments/:targetId/likes/count", countCommentLikesHandler);

router.post("/replies/:targetId/likes", addReplyLikeHandler);
router.delete("/replies/:targetId/likes", removeReplyLikeHandler);
router.get("/replies/:targetId/likes/count", countReplyLikesHandler);

export default router;
