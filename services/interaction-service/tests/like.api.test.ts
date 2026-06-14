import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const modelMocks = vi.hoisted(() => ({
  create: vi.fn(),
  findOneAndDelete: vi.fn(),
  countDocuments: vi.fn(),
}));

vi.mock("../src/models/like.model.js", () => ({
  Like: {
    create: modelMocks.create,
    findOneAndDelete: modelMocks.findOneAndDelete,
    countDocuments: modelMocks.countDocuments,
  },
  TARGET_TYPES: ["post", "comment", "reply"],
}));

import app from "../src/app.js";
import { createLikeRecord } from "./helpers/like.mock.js";

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
      prefix: "posts",
      targetType: "post" as const,
      targetId: "post-123",
      body: { userId: "alice" },
    },
    {
      prefix: "comments",
      targetType: "comment" as const,
      targetId: "comment-456",
      body: { userId: "alice", postId: "post-123" },
    },
    {
      prefix: "replies",
      targetType: "reply" as const,
      targetId: "reply-789",
      body: { userId: "alice", postId: "post-123" },
    },
  ])("$prefix likes", ({ prefix, targetType, targetId, body }) => {
    describe(`POST /${prefix}/:targetId/likes`, () => {
      it("crée un like", async () => {
        const record = createLikeRecord({
          userId: "alice",
          targetType,
          targetId,
          postId: "postId" in body ? body.postId : undefined,
        });
        modelMocks.create.mockResolvedValue(record);

        const response = await request(app)
          .post(`/${prefix}/${targetId}/likes`)
          .send(body);

        expect(response.status).toBe(201);
        expect(response.body.userId).toBe("alice");
        expect(response.body.targetType).toBe(targetType);
        expect(response.body.targetId).toBe(targetId);
      });

      it("refuse un body incomplet", async () => {
        const response = await request(app)
          .post(`/${prefix}/${targetId}/likes`)
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.error).toBe("userId est requis");
      });

      it("refuse un doublon", async () => {
        modelMocks.create.mockRejectedValue({ code: 11000 });

        const response = await request(app)
          .post(`/${prefix}/${targetId}/likes`)
          .send(body);

        expect(response.status).toBe(409);
        expect(response.body.error).toBe("Ce like existe déjà");
      });
    });

    describe(`DELETE /${prefix}/:targetId/likes`, () => {
      it("supprime un like", async () => {
        modelMocks.findOneAndDelete.mockResolvedValue(
          createLikeRecord({
            userId: "alice",
            targetType,
            targetId,
          })
        );

        const response = await request(app)
          .delete(`/${prefix}/${targetId}/likes`)
          .send({ userId: "alice" });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Like supprimé");
      });

      it("retourne 404 si le like n'existe pas", async () => {
        modelMocks.findOneAndDelete.mockResolvedValue(null);

        const response = await request(app)
          .delete(`/${prefix}/${targetId}/likes`)
          .send({ userId: "alice" });

        expect(response.status).toBe(404);
        expect(response.body.error).toBe("Like introuvable");
      });
    });

    describe(`GET /${prefix}/:targetId/likes/count`, () => {
      it("retourne le compteur", async () => {
        modelMocks.countDocuments.mockResolvedValue(5);

        const response = await request(app).get(
          `/${prefix}/${targetId}/likes/count`
        );

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ count: 5 });
      });
    });
  });
});
