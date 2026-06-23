import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const postLikeMocks = vi.hoisted(() => ({
  create: vi.fn(),
  findOneAndDelete: vi.fn(),
  countDocuments: vi.fn(),
  find: vi.fn(),
  deleteMany: vi.fn(),
}));

const commentLikeMocks = vi.hoisted(() => ({
  create: vi.fn(),
  findOneAndDelete: vi.fn(),
  countDocuments: vi.fn(),
  deleteMany: vi.fn(),
}));

const commentMocks = vi.hoisted(() => ({
  deleteMany: vi.fn(),
}));

const likeNotificationMocks = vi.hoisted(() => ({
  notifyPostLikeSafely: vi.fn(),
  notifyCommentLikeSafely: vi.fn(),
}));

vi.mock("../src/models/post-like.model.js", () => ({
  PostLike: {
    create: postLikeMocks.create,
    findOneAndDelete: postLikeMocks.findOneAndDelete,
    countDocuments: postLikeMocks.countDocuments,
    find: postLikeMocks.find,
    deleteMany: postLikeMocks.deleteMany,
  },
}));

vi.mock("../src/models/comment-like.model.js", () => ({
  CommentLike: {
    create: commentLikeMocks.create,
    findOneAndDelete: commentLikeMocks.findOneAndDelete,
    countDocuments: commentLikeMocks.countDocuments,
    deleteMany: commentLikeMocks.deleteMany,
  },
}));

vi.mock("../src/models/comment.model.js", () => ({
  Comment: {
    deleteMany: commentMocks.deleteMany,
  },
}));

vi.mock("../src/services/like-notification.service.js", () => ({
  notifyPostLikeSafely: likeNotificationMocks.notifyPostLikeSafely,
  notifyCommentLikeSafely: likeNotificationMocks.notifyCommentLikeSafely,
}));

import app from "../src/app.js";
import { createCommentLikeRecord, createPostLikeRecord } from "./helpers/like.mock.js";

describe("like API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /health", () => {
    it("retourne le statut du service", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
    });
  });

  describe("POST /posts/likes", () => {
    it("crée un like sur un post", async () => {
      const record = createPostLikeRecord({
        userId: "alice",
        postId: "post-123",
      });
      postLikeMocks.create.mockResolvedValue(record);

      const response = await request(app)
        .post("/posts/likes")
        .send({ userId: "alice", postId: "post-123" });

      expect(response.status).toBe(201);
      expect(response.body.userId).toBe("alice");
      expect(response.body.postId).toBe("post-123");
      expect(likeNotificationMocks.notifyPostLikeSafely).toHaveBeenCalledWith(
        "alice",
        "post-123"
      );
    });

    it("refuse un body incomplet", async () => {
      const response = await request(app)
        .post("/posts/likes")
        .send({ userId: "alice" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("userId et postId sont requis");
    });

    it("refuse un doublon", async () => {
      postLikeMocks.create.mockRejectedValue({ code: 11000 });

      const response = await request(app)
        .post("/posts/likes")
        .send({ userId: "alice", postId: "post-123" });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("Ce like existe déjà");
    });
  });

  describe("DELETE /posts/likes", () => {
    it("supprime un like", async () => {
      postLikeMocks.findOneAndDelete.mockResolvedValue(
        createPostLikeRecord({ userId: "alice", postId: "post-123" })
      );

      const response = await request(app)
        .delete("/posts/likes")
        .send({ userId: "alice", postId: "post-123" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Like supprimé");
    });

    it("retourne 404 si le like n'existe pas", async () => {
      postLikeMocks.findOneAndDelete.mockResolvedValue(null);

      const response = await request(app)
        .delete("/posts/likes")
        .send({ userId: "alice", postId: "post-123" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Like introuvable");
    });
  });

  describe("GET /posts/likes/count", () => {
    it("retourne le compteur via query param", async () => {
      postLikeMocks.countDocuments.mockResolvedValue(5);

      const response = await request(app).get("/posts/likes/count?postId=post-123");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ count: 5 });
    });

    it("retourne le compteur via body", async () => {
      postLikeMocks.countDocuments.mockResolvedValue(3);

      const response = await request(app)
        .get("/posts/likes/count")
        .send({ postId: "post-123" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ count: 3 });
    });
  });

  describe("GET /posts/likes", () => {
    it("retourne les userId des derniers likers", async () => {
      postLikeMocks.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue([
                { userId: "user-b" },
                { userId: "user-a" },
              ]),
            }),
          }),
        }),
      });

      const response = await request(app).get("/posts/likes?postId=post-123&limit=5");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ userIds: ["user-b", "user-a"] });
    });
  });

  describe("DELETE /posts/:postId/interactions", () => {
    it("supprime les commentaires et likes associes au post", async () => {
      commentMocks.deleteMany.mockResolvedValue({ deletedCount: 2 });
      postLikeMocks.deleteMany.mockResolvedValue({ deletedCount: 3 });
      commentLikeMocks.deleteMany.mockResolvedValue({ deletedCount: 4 });

      const response = await request(app).delete("/posts/post-123/interactions");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        status: "success",
        message: "Post interactions deleted",
        data: {
          commentsDeletedCount: 2,
          postLikesDeletedCount: 3,
          commentLikesDeletedCount: 4,
        },
      });
      expect(commentMocks.deleteMany).toHaveBeenCalledWith({
        postId: "post-123",
      });
      expect(postLikeMocks.deleteMany).toHaveBeenCalledWith({
        postId: "post-123",
      });
      expect(commentLikeMocks.deleteMany).toHaveBeenCalledWith({
        postId: "post-123",
      });
    });
  });

  describe("POST /comments/likes", () => {
    it("crée un like sur un commentaire racine", async () => {
      const record = createCommentLikeRecord({
        userId: "alice",
        commentId: "comment-456",
        postId: "post-123",
      });
      commentLikeMocks.create.mockResolvedValue(record);

      const response = await request(app)
        .post("/comments/likes")
        .send({
          userId: "alice",
          commentId: "comment-456",
          postId: "post-123",
        });

      expect(response.status).toBe(201);
      expect(response.body.commentId).toBe("comment-456");
      expect(likeNotificationMocks.notifyCommentLikeSafely).toHaveBeenCalledWith(
        "alice",
        "comment-456"
      );
    });

    it("crée un like sur une réponse via commentId", async () => {
      const record = createCommentLikeRecord({
        userId: "alice",
        commentId: "reply-789",
        postId: "post-123",
      });
      commentLikeMocks.create.mockResolvedValue(record);

      const response = await request(app)
        .post("/comments/likes")
        .send({
          userId: "alice",
          commentId: "reply-789",
          postId: "post-123",
        });

      expect(response.status).toBe(201);
      expect(response.body.commentId).toBe("reply-789");
    });

    it("refuse un body incomplet", async () => {
      const response = await request(app)
        .post("/comments/likes")
        .send({ userId: "alice", postId: "post-123" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("userId, commentId et postId sont requis");
    });

    it("refuse un doublon", async () => {
      commentLikeMocks.create.mockRejectedValue({ code: 11000 });

      const response = await request(app)
        .post("/comments/likes")
        .send({
          userId: "alice",
          commentId: "comment-456",
          postId: "post-123",
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("Ce like existe déjà");
    });
  });

  describe("DELETE /comments/likes", () => {
    it("supprime un like", async () => {
      commentLikeMocks.findOneAndDelete.mockResolvedValue(
        createCommentLikeRecord({
          userId: "alice",
          commentId: "comment-456",
          postId: "post-123",
        })
      );

      const response = await request(app)
        .delete("/comments/likes")
        .send({ userId: "alice", commentId: "comment-456" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Like supprimé");
    });

    it("retourne 404 si le like n'existe pas", async () => {
      commentLikeMocks.findOneAndDelete.mockResolvedValue(null);

      const response = await request(app)
        .delete("/comments/likes")
        .send({ userId: "alice", commentId: "comment-456" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Like introuvable");
    });
  });

  describe("GET /comments/likes/count", () => {
    it("retourne le compteur via query param", async () => {
      commentLikeMocks.countDocuments.mockResolvedValue(2);

      const response = await request(app).get(
        "/comments/likes/count?commentId=reply-789"
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ count: 2 });
    });
  });
});
