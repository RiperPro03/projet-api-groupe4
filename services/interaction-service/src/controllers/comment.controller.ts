import type { RequestHandler } from "express";

import {
  CommentError,
  createComment,
  getCommentReplies,
  getCommentsByAuthor,
  getCommentsByPost,
} from "../services/comment.service.js";
import { notifyCommentMentionsSafely } from "../services/mention-notification.service.js";

function getTrimmedString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getRouteParam(
  value: string | string[] | undefined
): string | null {
  const resolvedValue = Array.isArray(value) ? value[0] : value;

  return getTrimmedString(resolvedValue);
}

export const createCommentHandler: RequestHandler = async (req, res, next) => {
  try {
    const comment = await createComment({
      postId: req.body?.postId,
      authorId: req.body?.authorId,
      content: req.body?.content,
      parentCommentId: req.body?.parentCommentId,
    });

    notifyCommentMentionsSafely(
      comment.authorId,
      comment.id,
      comment.content
    );

    res.status(201).json({
      status: "success",
      message: "Comment created",
      data: { comment },
    });
  } catch (error) {
    next(error);
  }
};

export const getCommentsHandler: RequestHandler = async (req, res, next) => {
  try {
    const postId = getTrimmedString(req.query.postId);
    const authorId = getTrimmedString(req.query.authorId);

    if (!postId && !authorId) {
      throw new CommentError("postId ou authorId est requis", 400);
    }

    const comments = postId
      ? await getCommentsByPost(postId)
      : await getCommentsByAuthor(authorId as string);

    res.status(200).json({
      status: "success",
      message: "Comments retrieved",
      data: { comments },
    });
  } catch (error) {
    next(error);
  }
};

export const getCommentRepliesHandler: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const commentId = getRouteParam(req.params.commentId);

    if (!commentId) {
      throw new CommentError("commentId est requis", 400);
    }

    const comments = await getCommentReplies(commentId);

    res.status(200).json({
      status: "success",
      message: "Replies retrieved",
      data: { comments },
    });
  } catch (error) {
    next(error);
  }
};
