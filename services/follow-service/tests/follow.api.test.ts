import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { Prisma } from "../src/generated/prisma/client.js";
import { createFollowRecord } from "./helpers/prisma.mock.js";

vi.mock("../src/config/database.js", () => ({
  default: {
    follow: {
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    $connect: vi.fn(),
  },
}));

import prisma from "../src/config/database.js";
import app from "../src/app.js";

const mockPrisma = vi.mocked(prisma, true);

describe("follow API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /health", () => {
    it("retourne le statut du service", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        service: "follow-service",
        status: "OK",
      });
    });
  });

  describe("POST /", () => {
    it("crée un abonnement", async () => {
      const record = createFollowRecord("alice", "bob");
      mockPrisma.follow.create.mockResolvedValue(record);

      const response = await request(app)
        .post("/")
        .send({ followerId: "alice", followingId: "bob" });

      expect(response.status).toBe(201);
      expect(response.body.follower_id).toBe("alice");
      expect(response.body.following_id).toBe("bob");
    });

    it("refuse un body incomplet", async () => {
      const response = await request(app)
        .post("/")
        .send({ followerId: "alice" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "followerId et followingId sont requis"
      );
    });

    it("refuse un auto-follow", async () => {
      const response = await request(app)
        .post("/")
        .send({ followerId: "alice", followingId: "alice" });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "Un utilisateur ne peut pas se suivre lui-même"
      );
    });

    it("refuse un abonnement en double", async () => {
      mockPrisma.follow.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("Unique constraint", {
          code: "P2002",
          clientVersion: "7.8.0",
        })
      );

      const response = await request(app)
        .post("/")
        .send({ followerId: "alice", followingId: "bob" });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("Cet abonnement existe déjà");
    });
  });

  describe("DELETE /", () => {
    it("supprime uniquement la relation demandée", async () => {
      mockPrisma.follow.delete.mockResolvedValue(
        createFollowRecord("alice", "bob")
      );

      const response = await request(app)
        .delete("/")
        .send({ followerId: "alice", followingId: "bob" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Abonnement supprimé");
      expect(mockPrisma.follow.delete).toHaveBeenCalledTimes(1);
      expect(mockPrisma.follow.delete).toHaveBeenCalledWith({
        where: {
          follower_id_following_id: {
            follower_id: "alice",
            following_id: "bob",
          },
        },
      });
    });

    it("ne cible pas tous les follows d'un utilisateur", async () => {
      mockPrisma.follow.delete.mockResolvedValue(
        createFollowRecord("alice", "bob")
      );

      await request(app)
        .delete("/")
        .send({ followerId: "alice", followingId: "bob" });

      const deleteArgs = mockPrisma.follow.delete.mock.calls[0][0];
      expect(deleteArgs.where).toEqual({
        follower_id_following_id: {
          follower_id: "alice",
          following_id: "bob",
        },
      });
      expect(deleteArgs.where).not.toHaveProperty("follower_id");
      expect(deleteArgs.where).not.toHaveProperty("following_id");
    });

    it("retourne 404 si la relation n'existe pas", async () => {
      mockPrisma.follow.delete.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("Not found", {
          code: "P2025",
          clientVersion: "7.8.0",
        })
      );

      const response = await request(app)
        .delete("/")
        .send({ followerId: "alice", followingId: "bob" });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Abonnement introuvable");
    });
  });

  describe("GET /following", () => {
    it("retourne la liste des abonnements", async () => {
      mockPrisma.follow.findMany.mockResolvedValue([
        createFollowRecord("alice", "bob", "1"),
        createFollowRecord("alice", "charlie", "2"),
      ]);

      const response = await request(app)
        .get("/following")
        .send({ followerId: "alice", followingId: "bob" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].following_id).toBe("bob");
      expect(response.body[1].following_id).toBe("charlie");
    });
  });

  describe("GET /followers", () => {
    it("retourne la liste des abonnés", async () => {
      mockPrisma.follow.findMany.mockResolvedValue([
        createFollowRecord("alice", "bob", "1"),
      ]);

      const response = await request(app)
        .get("/followers")
        .send({ followerId: "alice", followingId: "bob" });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].follower_id).toBe("alice");
    });
  });
});
