import { beforeEach, describe, expect, it, vi } from "vitest";

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

import {
  addLike,
  countLikes,
  isTargetType,
  LikeError,
  removeLike,
} from "../src/services/like.service.js";
import { createLikeRecord } from "./helpers/like.mock.js";

describe("like.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe.each([
    ["post", "post-123", undefined],
    ["comment", "comment-456", "post-123"],
    ["reply", "reply-789", "post-123"],
  ] as const)("addLike (%s)", (targetType, targetId, postId) => {
    it("crée un like", async () => {
      const record = createLikeRecord({
        userId: "alice",
        targetType,
        targetId,
        postId,
      });
      modelMocks.create.mockResolvedValue(record);

      const result = await addLike("alice", targetType, targetId, postId);

      expect(result).toEqual(record);
      expect(modelMocks.create).toHaveBeenCalledWith({
        userId: "alice",
        targetType,
        targetId,
        ...(targetType === "post" || postId ? { postId: postId ?? targetId } : {}),
      });
    });

    it("refuse un doublon", async () => {
      modelMocks.create.mockRejectedValue({ code: 11000 });

      await expect(
        addLike("alice", targetType, targetId, postId)
      ).rejects.toMatchObject({
        statusCode: 409,
        message: "Ce like existe déjà",
      });
    });
  });

  describe("addLike validation", () => {
    it("refuse un userId vide", async () => {
      await expect(addLike("  ", "post", "post-123")).rejects.toMatchObject({
        statusCode: 400,
        message: "userId est requis",
      });
      expect(modelMocks.create).not.toHaveBeenCalled();
    });

    it("refuse un targetId vide", async () => {
      await expect(addLike("alice", "post", "  ")).rejects.toMatchObject({
        statusCode: 400,
        message: "targetId est requis",
      });
    });
  });

  describe.each([
    ["post", "post-123"],
    ["comment", "comment-456"],
    ["reply", "reply-789"],
  ] as const)("removeLike (%s)", (targetType, targetId) => {
    it("supprime un like existant", async () => {
      modelMocks.findOneAndDelete.mockResolvedValue(
        createLikeRecord({ userId: "alice", targetType, targetId })
      );

      await removeLike("alice", targetType, targetId);

      expect(modelMocks.findOneAndDelete).toHaveBeenCalledWith({
        userId: "alice",
        targetType,
        targetId,
      });
    });

    it("renvoie 404 si le like n'existe pas", async () => {
      modelMocks.findOneAndDelete.mockResolvedValue(null);

      await expect(removeLike("alice", targetType, targetId)).rejects.toMatchObject({
        statusCode: 404,
        message: "Like introuvable",
      });
    });
  });

  describe("removeLike validation", () => {
    it("refuse un userId vide", async () => {
      await expect(removeLike("  ", "post", "post-123")).rejects.toMatchObject({
        statusCode: 400,
        message: "userId est requis",
      });
    });
  });

  describe.each([
    ["post", "post-123", 3],
    ["comment", "comment-456", 1],
    ["reply", "reply-789", 0],
  ] as const)("countLikes (%s)", (targetType, targetId, expectedCount) => {
    it("retourne le nombre de likes", async () => {
      modelMocks.countDocuments.mockResolvedValue(expectedCount);

      const result = await countLikes(targetType, targetId);

      expect(result).toBe(expectedCount);
      expect(modelMocks.countDocuments).toHaveBeenCalledWith({
        targetType,
        targetId,
      });
    });
  });

  describe("countLikes validation", () => {
    it("refus si targetId vide", async () => {
      await expect(countLikes("post", "  ")).rejects.toMatchObject({
        statusCode: 400,
        message: "targetId est requis",
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

  describe("isTargetType", () => {
    it("valide les types supportés", () => {
      expect(isTargetType("post")).toBe(true);
      expect(isTargetType("comment")).toBe(true);
      expect(isTargetType("reply")).toBe(true);
      expect(isTargetType("invalid")).toBe(false);
    });
  });
});
