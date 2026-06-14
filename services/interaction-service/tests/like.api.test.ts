import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

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
      expect(response.body).toMatchObject({
        service: "interaction-service",
        status: "OK",
      });
    });
  });

  describe.each([
    {
      label: "post",
      prefix: "posts",
      targetId: "post-123",
      body: { userId: "alice" },
      createRecord: () =>
        createPostLikeRecord({ userId: "alice", postId: "post-123" }),
      mocks: postLikeMocks,
      expectedField: "postId" as const,
    },
    {
      label: "commentaire racine",
      prefix: "comments",
      targetId: "comment-456",
      body: { userId: "alice", postId: "post-123" },
      createRecord: () =>
        createCommentLikeRecord({
          userId: "alice",
          commentId: "comment-456",
          postId: "post-123",
        }),
      mocks: commentLikeMocks,
      expectedField: "commentId" as const,
    },
    {
      label: "réponse (commentaire enfant)",
      prefix: "comments",
      targetId: "reply-789",
      body: { userId: "alice", postId: "post-123" },
      createRecord: () =>
        createCommentLikeRecord({
          userId: "alice",
          commentId: "reply-789",
          postId: "post-123",
        }),
      mocks: commentLikeMocks,
      expectedField: "commentId" as const,
    },
  ])(
    "$label likes",
    ({ prefix, targetId, body, createRecord, mocks, expectedField }) => {
      describe(`POST /${prefix}/:targetId/likes`, () => {
        it("crée un like", async () => {
          const record = createRecord();
          mocks.create.mockResolvedValue(record);

          const response = await request(app)
            .post(`/${prefix}/${targetId}/likes`)
            .send(body);

          expect(response.status).toBe(201);
          expect(response.body.userId).toBe("alice");
          expect(response.body[expectedField]).toBe(targetId);
        });

        it("refuse un body incomplet", async () => {
          const response = await request(app)
            .post(`/${prefix}/${targetId}/likes`)
            .send({});

          expect(response.status).toBe(400);
          expect(response.body.error).toBe("userId est requis");
        });

        it("refuse un doublon", async () => {
          mocks.create.mockRejectedValue({ code: 11000 });

          const response = await request(app)
            .post(`/${prefix}/${targetId}/likes`)
            .send(body);

          expect(response.status).toBe(409);
          expect(response.body.error).toBe("Ce like existe déjà");
        });
      });

      describe(`DELETE /${prefix}/:targetId/likes`, () => {
        it("supprime un like", async () => {
          mocks.findOneAndDelete.mockResolvedValue(createRecord());

          const response = await request(app)
            .delete(`/${prefix}/${targetId}/likes`)
            .send({ userId: "alice" });

          expect(response.status).toBe(200);
          expect(response.body.message).toBe("Like supprimé");
        });

        it("retourne 404 si le like n'existe pas", async () => {
          mocks.findOneAndDelete.mockResolvedValue(null);

          const response = await request(app)
            .delete(`/${prefix}/${targetId}/likes`)
            .send({ userId: "alice" });

          expect(response.status).toBe(404);
          expect(response.body.error).toBe("Like introuvable");
        });
      });

      describe(`GET /${prefix}/:targetId/likes/count`, () => {
        it("retourne le compteur", async () => {
          mocks.countDocuments.mockResolvedValue(5);

          const response = await request(app).get(
            `/${prefix}/${targetId}/likes/count`
          );

          expect(response.status).toBe(200);
          expect(response.body).toEqual({ count: 5 });
        });
      });
    }
  );
});
