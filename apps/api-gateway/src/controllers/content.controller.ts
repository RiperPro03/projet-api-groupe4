import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  getCommentReplies,
  getComments,
  getFeedPostPage,
  getPost,
  getPostPage,
} from "../services/content.service";

const getLimit = (value: unknown) => {
  const parsedLimit = Number.parseInt(String(value ?? "5"), 10);

  return Number.isNaN(parsedLimit) ? 5 : parsedLimit;
};

const getCursor = (value: unknown) =>
  typeof value === "string" && value.trim() ? value : null;

const getRouteParam = (value: unknown) => {
  const resolvedValue = Array.isArray(value) ? value[0] : value;

  return typeof resolvedValue === "string" && resolvedValue.trim()
    ? resolvedValue
    : null;
};

export const getFeedPostsController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.authUser?.id;

  if (!userId) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }

  const page = await getFeedPostPage(userId, {
    limit: getLimit(req.query.limit),
    cursor: getCursor(req.query.cursor),
  });

  return res.status(200).json(page);
};

export const getPostsByAuthorController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.authUser?.id;
  const authorId = getRouteParam(req.query.authorId);

  if (!userId) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }

  if (!authorId) {
    return res.status(400).json({
      status: "error",
      message: "authorId query param is required",
    });
  }

  const page = await getPostPage("/", {
    authorId,
    limit: getLimit(req.query.limit),
    cursor: getCursor(req.query.cursor),
  }, userId);

  return res.status(200).json(page);
};

export const getAllPostsController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.authUser?.id;

  if (!userId) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }

  const page = await getPostPage("/all", {
    limit: getLimit(req.query.limit),
    cursor: getCursor(req.query.cursor),
  }, userId);

  return res.status(200).json(page);
};

export const getPostByIdController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.authUser?.id;
  const postId = getRouteParam(req.params.id);

  if (!userId) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }

  if (!postId) {
    return res.status(400).json({
      status: "error",
      message: "id param is required",
    });
  }

  const post = await getPost(postId, userId);

  return res.status(200).json(post);
};

export const getCommentsController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.authUser?.id;

  if (!userId) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }

  const comments = await getComments({
    postId: getRouteParam(req.query.postId) ?? undefined,
    authorId: getRouteParam(req.query.authorId) ?? undefined,
  }, userId);

  return res.status(200).json(comments);
};

export const getCommentRepliesController = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const userId = req.authUser?.id;
  const commentId = getRouteParam(req.params.commentId);

  if (!userId) {
    return res.status(401).json({ status: "error", message: "Unauthorized" });
  }

  if (!commentId) {
    return res.status(400).json({
      status: "error",
      message: "commentId param is required",
    });
  }

  const comments = await getCommentReplies(commentId, userId);

  return res.status(200).json(comments);
};
