import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const commentMocks = vi.hoisted(() => ({
  create: vi.fn(),
  findOne: vi.fn(),
  find: vi.fn(),
}));

vi.mock("../src/models/comment.model.js", () => ({
  Comment: {
    create: commentMocks.create,
    findOne: commentMocks.findOne,
    find: commentMocks.find,
  },
}));

import app from "../src/app.js";
import { createCommentRecord } from "./helpers/comment.mock.js";

describe("comment API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /posts/:postId/comments", () => {
    it("crée un commentaire racine (Fx7)", async () => {
      const record = createCommentRecord({
        id: "comment-456",
        postId: "post-123",
        userId: "alice",
        content: "Très intéressant !",
      });
      commentMocks.create.mockResolvedValue(record);

      const response = await request(app)
        .post("/posts/post-123/comments")
        .send({ userId: "alice", content: "Très intéressant !" });

      expect(response.status).toBe(201);
      expect(response.body.userId).toBe("alice");
      expect(response.body.content).toBe("Très intéressant !");
    });

    it("crée une réponse (Fx8)", async () => {
      const parent = createCommentRecord({
        id: "comment-456",
        postId: "post-123",
        userId: "alice",
        content: "Parent",
      });
      const reply = createCommentRecord({
        id: "reply-789",
        postId: "post-123",
        userId: "bob",
        content: "Je suis d'accord",
        parentCommentId: "comment-456",
      });
      commentMocks.findOne.mockResolvedValue(parent);
      commentMocks.create.mockResolvedValue(reply);

      const response = await request(app)
        .post("/posts/post-123/comments")
        .send({
          userId: "bob",
          content: "Je suis d'accord",
          parentCommentId: "comment-456",
        });

      expect(response.status).toBe(201);
      expect(response.body.parentCommentId).toBe("comment-456");
    });

    it("refuse un body incomplet", async () => {
      const response = await request(app)
        .post("/posts/post-123/comments")
        .send({ userId: "alice" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("userId et content sont requis");
    });
  });

  describe("PATCH /posts/:postId/comments/:commentId", () => {
    it("met à jour un commentaire", async () => {
      const save = vi.fn().mockResolvedValue(undefined);
      const record = createCommentRecord({
        id: "comment-456",
        postId: "post-123",
        userId: "alice",
        content: "Ancien",
        save,
      });
      commentMocks.findOne.mockResolvedValue(record);

      const response = await request(app)
        .patch("/posts/post-123/comments/comment-456")
        .send({ userId: "alice", content: "Nouveau contenu" });

      expect(response.status).toBe(200);
      expect(response.body.content).toBe("Nouveau contenu");
    });

    it("retourne 403 pour un non-auteur", async () => {
      commentMocks.findOne.mockResolvedValue(
        createCommentRecord({
          id: "comment-456",
          postId: "post-123",
          userId: "alice",
          content: "Contenu",
        })
      );

      const response = await request(app)
        .patch("/posts/post-123/comments/comment-456")
        .send({ userId: "bob", content: "Hack" });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe("Action non autorisée");
    });

    it("retourne 404 si introuvable", async () => {
      commentMocks.findOne.mockResolvedValue(null);

      const response = await request(app)
        .patch("/posts/post-123/comments/comment-456")
        .send({ userId: "alice", content: "Nouveau" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Commentaire introuvable");
    });
  });

  describe("DELETE /posts/:postId/comments/:commentId", () => {
    it("supprime un commentaire", async () => {
      const save = vi.fn().mockResolvedValue(undefined);
      commentMocks.findOne.mockResolvedValue(
        createCommentRecord({
          id: "comment-456",
          postId: "post-123",
          userId: "alice",
          content: "Contenu",
          save,
        })
      );

      const response = await request(app)
        .delete("/posts/post-123/comments/comment-456")
        .send({ userId: "alice" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Commentaire supprimé");
    });

    it("retourne 403 pour un non-auteur", async () => {
      commentMocks.findOne.mockResolvedValue(
        createCommentRecord({
          id: "comment-456",
          postId: "post-123",
          userId: "alice",
          content: "Contenu",
        })
      );

      const response = await request(app)
        .delete("/posts/post-123/comments/comment-456")
        .send({ userId: "bob" });

      expect(response.status).toBe(403);
    });
  });

  describe("GET /posts/:postId/comments", () => {
    it("retourne les commentaires racine", async () => {
      const sort = vi.fn().mockResolvedValue([
        createCommentRecord({
          id: "comment-456",
          postId: "post-123",
          userId: "alice",
          content: "Racine",
        }),
      ]);
      commentMocks.find.mockReturnValue({ sort });

      const response = await request(app).get("/posts/post-123/comments");

      expect(response.status).toBe(200);
      expect(response.body.comments).toHaveLength(1);
      expect(response.body.comments[0].content).toBe("Racine");
    });

    it("retourne les réponses via query param", async () => {
      const sort = vi.fn().mockResolvedValue([]);
      commentMocks.find.mockReturnValue({ sort });

      const response = await request(app).get(
        "/posts/post-123/comments?parentCommentId=comment-456"
      );

      expect(response.status).toBe(200);
      expect(commentMocks.find).toHaveBeenCalledWith({
        postId: "post-123",
        deletedAt: null,
        parentCommentId: "comment-456",
      });
    });

    it("retourne les réponses via body", async () => {
      const sort = vi.fn().mockResolvedValue([]);
      commentMocks.find.mockReturnValue({ sort });

      const response = await request(app)
        .get("/posts/post-123/comments")
        .send({ parentCommentId: "comment-456" });

      expect(response.status).toBe(200);
      expect(commentMocks.find).toHaveBeenCalledWith({
        postId: "post-123",
        deletedAt: null,
        parentCommentId: "comment-456",
      });
    });
  });
});
