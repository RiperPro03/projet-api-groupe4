import type { RequestHandler } from "express";

import { CommentError } from "../services/comment.service.js";
import { deletePostInteractions } from "../services/post-interaction-cleanup.service.js";

function getTrimmedString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getRouteParam(value: string | string[] | undefined): string | null {
  const resolvedValue = Array.isArray(value) ? value[0] : value;

  return getTrimmedString(resolvedValue);
}

export const deletePostInteractionsHandler: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const postId = getRouteParam(req.params.postId);

    if (!postId) {
      throw new CommentError("postId est requis", 400);
    }

    const result = await deletePostInteractions(postId);

    res.status(200).json({
      status: "success",
      message: "Post interactions deleted",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
