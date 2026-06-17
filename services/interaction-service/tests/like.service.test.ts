import { beforeEach, describe, expect, it, vi } from "vitest";

const postLikeMocks = vi.hoisted(() => ({
  create: vi.fn(),
  findOneAndDelete: vi.fn(),
  countDocuments: vi.fn(),
}));

const commentLikeMocks = vi.hoisted(() => ({
  create: vi.fn(),
  findOneAndDelete: vi.fn(),
  countDocuments: vi.fn(),
}));

vi.mock("../src/models/post-like.model.js", () => ({
  PostLike: {
    create: postLikeMocks.create,
    findOneAndDelete: postLikeMocks.findOneAndDelete,
    countDocuments: postLikeMocks.countDocuments,
  },
}));

vi.mock("../src/models/comment-like.model.js", () => ({
  CommentLike: {
    create: commentLikeMocks.create,
    findOneAndDelete: commentLikeMocks.findOneAndDelete,
    countDocuments: commentLikeMocks.countDocuments,
  },
}));

import {
  addCommentLike,
  addPostLike,
  countCommentLikes,
  countPostLikes,
  LikeError,
  removeCommentLike,
  removePostLike,
} from "../src/services/like.service.js";
import { createCommentLikeRecord, createPostLikeRecord } from "./helpers/like.mock.js";

describe("like.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addPostLike", () => {
    it("crée un like sur un post", async () => {
      const record = createPostLikeRecord({
        userId: "alice",
        postId: "post-123",
      });
      postLikeMocks.create.mockResolvedValue(record);

      const result = await addPostLike("alice", "post-123");

      expect(result).toEqual(record);
      expect(postLikeMocks.create).toHaveBeenCalledWith({
        userId: "alice",
        postId: "post-123",
      });
    });

    it("refuse un doublon", async () => {
      postLikeMocks.create.mockRejectedValue({ code: 11000 });

      await expect(addPostLike("alice", "post-123")).rejects.toMatchObject({
        statusCode: 409,
        message: "Ce like existe déjà",
      });
    });

    it("refuse un userId vide", async () => {
      await expect(addPostLike("  ", "post-123")).rejects.toMatchObject({
        statusCode: 400,
        message: "userId est requis",
      });
      expect(postLikeMocks.create).not.toHaveBeenCalled();
    });

    it("refuse un postId vide", async () => {
      await expect(addPostLike("alice", "  ")).rejects.toMatchObject({
        statusCode: 400,
        message: "postId est requis",
      });
    });
  });

  describe("removePostLike", () => {
    it("supprime un like existant", async () => {
      postLikeMocks.findOneAndDelete.mockResolvedValue(
        createPostLikeRecord({ userId: "alice", postId: "post-123" })
      );

      await removePostLike("alice", "post-123");

      expect(postLikeMocks.findOneAndDelete).toHaveBeenCalledWith({
        userId: "alice",
        postId: "post-123",
      });
    });

    it("renvoie 404 si le like n'existe pas", async () => {
      postLikeMocks.findOneAndDelete.mockResolvedValue(null);

      await expect(removePostLike("alice", "post-123")).rejects.toMatchObject({
        statusCode: 404,
        message: "Like introuvable",
      });
    });
  });

  describe("countPostLikes", () => {
    it("retourne le nombre de likes", async () => {
      postLikeMocks.countDocuments.mockResolvedValue(3);

      const result = await countPostLikes("post-123");

      expect(result).toBe(3);
      expect(postLikeMocks.countDocuments).toHaveBeenCalledWith({
        postId: "post-123",
      });
    });
  });

  describe("addCommentLike", () => {
    it("crée un like sur un commentaire racine", async () => {
      const record = createCommentLikeRecord({
        userId: "alice",
        commentId: "comment-456",
        postId: "post-123",
      });
      commentLikeMocks.create.mockResolvedValue(record);

      const result = await addCommentLike("alice", "comment-456", "post-123");

      expect(result).toEqual(record);
      expect(commentLikeMocks.create).toHaveBeenCalledWith({
        userId: "alice",
        commentId: "comment-456",
        postId: "post-123",
      });
    });

    it("crée un like sur une réponse via commentId", async () => {
      const record = createCommentLikeRecord({
        userId: "alice",
        commentId: "reply-789",
        postId: "post-123",
      });
      commentLikeMocks.create.mockResolvedValue(record);

      const result = await addCommentLike("alice", "reply-789", "post-123");

      expect(result).toEqual(record);
      expect(commentLikeMocks.create).toHaveBeenCalledWith({
        userId: "alice",
        commentId: "reply-789",
        postId: "post-123",
      });
    });

    it("refuse un doublon", async () => {
      commentLikeMocks.create.mockRejectedValue({ code: 11000 });

      await expect(
        addCommentLike("alice", "comment-456", "post-123")
      ).rejects.toMatchObject({
        statusCode: 409,
        message: "Ce like existe déjà",
      });
    });

    it("refuse un postId vide", async () => {
      await expect(
        addCommentLike("alice", "comment-456", "  ")
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "postId est requis",
      });
    });
  });

  describe("removeCommentLike", () => {
    it("supprime un like existant", async () => {
      commentLikeMocks.findOneAndDelete.mockResolvedValue(
        createCommentLikeRecord({
          userId: "alice",
          commentId: "comment-456",
          postId: "post-123",
        })
      );

      await removeCommentLike("alice", "comment-456");

      expect(commentLikeMocks.findOneAndDelete).toHaveBeenCalledWith({
        userId: "alice",
        commentId: "comment-456",
      });
    });

    it("renvoie 404 si le like n'existe pas", async () => {
      commentLikeMocks.findOneAndDelete.mockResolvedValue(null);

      await expect(removeCommentLike("alice", "comment-456")).rejects.toMatchObject({
        statusCode: 404,
        message: "Like introuvable",
      });
    });
  });

  describe("countCommentLikes", () => {
    it("retourne le nombre de likes d'un commentaire", async () => {
      commentLikeMocks.countDocuments.mockResolvedValue(1);

      const result = await countCommentLikes("comment-456");

      expect(result).toBe(1);
      expect(commentLikeMocks.countDocuments).toHaveBeenCalledWith({
        commentId: "comment-456",
      });
    });

    it("retourne le nombre de likes d'une réponse", async () => {
      commentLikeMocks.countDocuments.mockResolvedValue(2);

      const result = await countCommentLikes("reply-789");

      expect(result).toBe(2);
      expect(commentLikeMocks.countDocuments).toHaveBeenCalledWith({
        commentId: "reply-789",
      });
    });
  });

  describe("LikeError", () => {
    it("expose le status HTTP métier", () => {
      const error = new LikeError("test", 418);
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(418);
    });
  });
});
