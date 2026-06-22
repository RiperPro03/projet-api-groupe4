import { beforeEach, describe, expect, it, vi } from "vitest";

const postClientMocks = vi.hoisted(() => ({
  getPostAuthorId: vi.fn(),
}));

const notificationClientMocks = vi.hoisted(() => ({
  createLikeNotification: vi.fn(),
}));

const commentMocks = vi.hoisted(() => ({
  findById: vi.fn(),
}));

vi.mock("../src/clients/post.client.js", () => ({
  getPostAuthorId: postClientMocks.getPostAuthorId,
}));

vi.mock("../src/clients/notification.client.js", () => ({
  createLikeNotification: notificationClientMocks.createLikeNotification,
}));

vi.mock("../src/models/comment.model.js", () => ({
  Comment: {
    findById: commentMocks.findById,
  },
}));

import {
  notifyCommentLikeSafely,
  notifyPostLikeSafely,
} from "../src/services/like-notification.service.js";

describe("like-notification.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notificationClientMocks.createLikeNotification.mockResolvedValue(undefined);
  });

  describe("notifyPostLikeSafely", () => {
    it("envoie une notification quand l'auteur est différent du liker", async () => {
      postClientMocks.getPostAuthorId.mockResolvedValue("user-b");

      notifyPostLikeSafely("user-a", "post-123");
      await vi.waitFor(() => {
        expect(notificationClientMocks.createLikeNotification).toHaveBeenCalled();
      });

      expect(notificationClientMocks.createLikeNotification).toHaveBeenCalledWith({
        recipientId: "user-b",
        actorId: "user-a",
        resourceType: "post",
        resourceId: "post-123",
      });
    });

    it("n'envoie pas de notification en self-like", async () => {
      postClientMocks.getPostAuthorId.mockResolvedValue("user-a");

      notifyPostLikeSafely("user-a", "post-123");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(notificationClientMocks.createLikeNotification).not.toHaveBeenCalled();
    });

    it("n'échoue pas si notification-service est indisponible", async () => {
      postClientMocks.getPostAuthorId.mockResolvedValue("user-b");
      notificationClientMocks.createLikeNotification.mockRejectedValue(
        new Error("notification-service down")
      );
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      notifyPostLikeSafely("user-a", "post-123");
      await vi.waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("notifyCommentLikeSafely", () => {
    it("envoie une notification quand l'auteur du commentaire est différent", async () => {
      commentMocks.findById.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({ authorId: "user-b", postId: "post-123" }),
        }),
      });

      notifyCommentLikeSafely("user-a", "comment-123");
      await vi.waitFor(() => {
        expect(notificationClientMocks.createLikeNotification).toHaveBeenCalled();
      });

      expect(notificationClientMocks.createLikeNotification).toHaveBeenCalledWith({
        recipientId: "user-b",
        actorId: "user-a",
        resourceType: "comment",
        resourceId: "comment-123",
        postId: "post-123",
      });
    });

    it("n'envoie pas de notification en self-like", async () => {
      commentMocks.findById.mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({ authorId: "user-a" }),
        }),
      });

      notifyCommentLikeSafely("user-a", "comment-123");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(notificationClientMocks.createLikeNotification).not.toHaveBeenCalled();
    });
  });
});
