import { Router } from "express";

import {
  createCommentHandler,
  deleteCommentHandler,
  listCommentsHandler,
  updateCommentHandler,
} from "../controllers/comment.controller.js";

const router = Router();

router.post("/posts/:postId/comments", createCommentHandler);
router.get("/posts/:postId/comments", listCommentsHandler);
router.patch("/posts/:postId/comments/:commentId", updateCommentHandler);
router.delete("/posts/:postId/comments/:commentId", deleteCommentHandler);

export default router;
