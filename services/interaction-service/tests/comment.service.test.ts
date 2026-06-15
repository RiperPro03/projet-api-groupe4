import { beforeEach, describe, expect, it, vi } from "vitest";

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

import {
  CommentError,
  createComment,
  deleteComment,
  listComments,
  updateComment,
} from "../src/services/comment.service.js";
import { createCommentRecord } from "./helpers/comment.mock.js";

describe("comment.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createComment", () => {
    it("crée un commentaire racine (Fx7)", async () => {
      const record = createCommentRecord({
        id: "comment-456",
        postId: "post-123",
        userId: "alice",
        content: "Très intéressant !",
      });
      commentMocks.create.mockResolvedValue(record);

      const result = await createComment(
        "post-123",
        "alice",
        "Très intéressant !"
      );

      expect(result).toEqual(record);
      expect(commentMocks.create).toHaveBeenCalledWith({
        postId: "post-123",
        userId: "alice",
        content: "Très intéressant !",
        parentCommentId: null,
      });
      expect(commentMocks.findOne).not.toHaveBeenCalled();
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

      const result = await createComment(
        "post-123",
        "bob",
        "Je suis d'accord",
        "comment-456"
      );

      expect(result).toEqual(reply);
      expect(commentMocks.findOne).toHaveBeenCalledWith({
        _id: "comment-456",
        postId: "post-123",
        deletedAt: null,
      });
      expect(commentMocks.create).toHaveBeenCalledWith({
        postId: "post-123",
        userId: "bob",
        content: "Je suis d'accord",
        parentCommentId: "comment-456",
      });
    });

    it("refuse un userId vide", async () => {
      await expect(createComment("post-123", "  ", "contenu")).rejects.toMatchObject({
        statusCode: 400,
        message: "userId est requis",
      });
      expect(commentMocks.create).not.toHaveBeenCalled();
    });

    it("refuse un content vide", async () => {
      await expect(createComment("post-123", "alice", "  ")).rejects.toMatchObject({
        statusCode: 400,
        message: "content est requis",
      });
    });

    it("refuse un postId vide", async () => {
      await expect(createComment("  ", "alice", "contenu")).rejects.toMatchObject({
        statusCode: 400,
        message: "postId est requis",
      });
    });

    it("refuse si le parent est introuvable", async () => {
      commentMocks.findOne.mockResolvedValue(null);

      await expect(
        createComment("post-123", "bob", "réponse", "comment-456")
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Commentaire parent introuvable",
      });
    });

    it("refuse une réponse à une réponse", async () => {
      const parent = createCommentRecord({
        id: "reply-789",
        postId: "post-123",
        userId: "bob",
        content: "Réponse",
        parentCommentId: "comment-456",
      });
      commentMocks.findOne.mockResolvedValue(parent);

      await expect(
        createComment("post-123", "charlie", "nested", "reply-789")
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Impossible de répondre à une réponse",
      });
    });
  });

  describe("updateComment", () => {
    it("met à jour un commentaire par son auteur", async () => {
      const save = vi.fn().mockResolvedValue(undefined);
      const record = createCommentRecord({
        id: "comment-456",
        postId: "post-123",
        userId: "alice",
        content: "Ancien",
        save,
      });
      commentMocks.findOne.mockResolvedValue(record);

      const result = await updateComment(
        "post-123",
        "comment-456",
        "alice",
        "Nouveau contenu"
      );

      expect(result.content).toBe("Nouveau contenu");
      expect(save).toHaveBeenCalled();
    });

    it("refuse la modification par un non-auteur", async () => {
      commentMocks.findOne.mockResolvedValue(
        createCommentRecord({
          id: "comment-456",
          postId: "post-123",
          userId: "alice",
          content: "Contenu",
        })
      );

      await expect(
        updateComment("post-123", "comment-456", "bob", "Hack")
      ).rejects.toMatchObject({
        statusCode: 403,
        message: "Action non autorisée",
      });
    });

    it("retourne 404 si le commentaire est introuvable", async () => {
      commentMocks.findOne.mockResolvedValue(null);

      await expect(
        updateComment("post-123", "comment-456", "alice", "Nouveau")
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Commentaire introuvable",
      });
    });
  });

  describe("deleteComment", () => {
    it("soft-delete un commentaire par son auteur", async () => {
      const save = vi.fn().mockResolvedValue(undefined);
      const record = createCommentRecord({
        id: "comment-456",
        postId: "post-123",
        userId: "alice",
        content: "Contenu",
        save,
      });
      commentMocks.findOne.mockResolvedValue(record);

      await deleteComment("post-123", "comment-456", "alice");

      expect(record.deletedAt).toBeInstanceOf(Date);
      expect(save).toHaveBeenCalled();
    });

    it("refuse la suppression par un non-auteur", async () => {
      commentMocks.findOne.mockResolvedValue(
        createCommentRecord({
          id: "comment-456",
          postId: "post-123",
          userId: "alice",
          content: "Contenu",
        })
      );

      await expect(
        deleteComment("post-123", "comment-456", "bob")
      ).rejects.toMatchObject({
        statusCode: 403,
        message: "Action non autorisée",
      });
    });
  });

  describe("listComments", () => {
    it("liste les commentaires racine", async () => {
      const sort = vi.fn().mockResolvedValue([
        createCommentRecord({
          id: "comment-456",
          postId: "post-123",
          userId: "alice",
          content: "Racine",
        }),
      ]);
      commentMocks.find.mockReturnValue({ sort });

      const result = await listComments("post-123");

      expect(commentMocks.find).toHaveBeenCalledWith({
        postId: "post-123",
        deletedAt: null,
        parentCommentId: null,
      });
      expect(sort).toHaveBeenCalledWith({ createdAt: 1 });
      expect(result).toHaveLength(1);
    });

    it("liste les réponses d'un commentaire", async () => {
      const sort = vi.fn().mockResolvedValue([]);
      commentMocks.find.mockReturnValue({ sort });

      await listComments("post-123", "comment-456");

      expect(commentMocks.find).toHaveBeenCalledWith({
        postId: "post-123",
        deletedAt: null,
        parentCommentId: "comment-456",
      });
    });
  });

  describe("CommentError", () => {
    it("expose le code HTTP", () => {
      const error = new CommentError("test", 400);
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe("CommentError");
    });
  });
});
