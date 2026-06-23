import { Router } from "express";

import {
  createCommentHandler,
  getCommentByIdHandler,
  getCommentRepliesHandler,
  getCommentsHandler,
} from "../controllers/comment.controller.js";

const router = Router();

router.get("/comments", getCommentsHandler);
router.post("/comments", createCommentHandler);
router.get("/comments/:commentId/replies", getCommentRepliesHandler);
router.get("/comments/:commentId", getCommentByIdHandler);

export default router;
