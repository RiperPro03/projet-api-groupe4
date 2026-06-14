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

router.post("/posts/:targetId/likes", addPostLikeHandler);
router.delete("/posts/:targetId/likes", removePostLikeHandler);
router.get("/posts/:targetId/likes/count", countPostLikesHandler);

router.post("/comments/:targetId/likes", addCommentLikeHandler);
router.delete("/comments/:targetId/likes", removeCommentLikeHandler);
router.get("/comments/:targetId/likes/count", countCommentLikesHandler);

export default router;
