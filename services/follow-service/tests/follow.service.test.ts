import { beforeEach, describe, expect, it, vi } from "vitest";
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
import {
  addFollow,
  unfollow,
  getFollowing,
  getFollowers,
  FollowError,
} from "../src/services/follow.service.js";

const mockPrisma = vi.mocked(prisma, true);

describe("follow.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addFollow", () => {
    it("crée un abonnement", async () => {
      const record = createFollowRecord("alice", "bob");
      mockPrisma.follow.create.mockResolvedValue(record);

      const result = await addFollow("alice", "bob");

      expect(result).toEqual(record);
      expect(mockPrisma.follow.create).toHaveBeenCalledWith({
        data: {
          follower_id: "alice",
          following_id: "bob",
        },
      });
    });

    it("refuse de se suivre soi-même", async () => {
      await expect(addFollow("alice", "alice")).rejects.toMatchObject({
        statusCode: 400,
        message: "Un utilisateur ne peut pas se suivre lui-même",
      });
      expect(mockPrisma.follow.create).not.toHaveBeenCalled();
    });

    it("refuse un abonnement en double", async () => {
      mockPrisma.follow.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("Unique constraint", {
          code: "P2002",
          clientVersion: "7.8.0",
        })
      );

      await expect(addFollow("alice", "bob")).rejects.toMatchObject({
        statusCode: 409,
        message: "Cet abonnement existe déjà",
      });
    });
  });

  describe("unfollow", () => {
    it("supprime uniquement la relation ciblée", async () => {
      mockPrisma.follow.delete.mockResolvedValue(
        createFollowRecord("alice", "bob")
      );

      await unfollow("alice", "bob");

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

    it("ne supprime pas les autres abonnements du même utilisateur", async () => {
      mockPrisma.follow.delete.mockResolvedValue(
        createFollowRecord("alice", "bob")
      );

      await unfollow("alice", "bob");

      const deleteCall = mockPrisma.follow.delete.mock.calls[0][0];
      expect(deleteCall.where).not.toEqual({ follower_id: "alice" });
      expect(deleteCall.where).not.toEqual({ following_id: "bob" });
      expect(deleteCall.where).toEqual({
        follower_id_following_id: {
          follower_id: "alice",
          following_id: "bob",
        },
      });
    });

    it("renvoie 404 si la relation n'existe pas", async () => {
      mockPrisma.follow.delete.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("Not found", {
          code: "P2025",
          clientVersion: "7.8.0",
        })
      );

      await expect(unfollow("alice", "bob")).rejects.toMatchObject({
        statusCode: 404,
        message: "Abonnement introuvable",
      });
    });
  });

  describe("getFollowing", () => {
    it("retourne les abonnements d'un utilisateur", async () => {
      const records = [
        createFollowRecord("alice", "bob", "1"),
        createFollowRecord("alice", "charlie", "2"),
      ];
      mockPrisma.follow.findMany.mockResolvedValue(records);

      const result = await getFollowing("alice");

      expect(result).toEqual(records);
      expect(mockPrisma.follow.findMany).toHaveBeenCalledWith({
        where: { follower_id: "alice" },
        orderBy: { created_at: "desc" },
      });
    });
  });

  describe("getFollowers", () => {
    it("retourne les abonnés d'un utilisateur", async () => {
      const records = [createFollowRecord("alice", "bob", "1")];
      mockPrisma.follow.findMany.mockResolvedValue(records);

      const result = await getFollowers("bob");

      expect(result).toEqual(records);
      expect(mockPrisma.follow.findMany).toHaveBeenCalledWith({
        where: { following_id: "bob" },
        orderBy: { created_at: "desc" },
      });
    });
  });

  describe("FollowError", () => {
    it("expose le status HTTP métier", () => {
      const error = new FollowError("test", 418);
      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(418);
    });
  });
});
