import { beforeEach, describe, expect, it, vi } from "vitest";

const profileClientMocks = vi.hoisted(() => ({
  getUserIdByUsername: vi.fn(),
}));

const notificationClientMocks = vi.hoisted(() => ({
  createMentionNotification: vi.fn(),
}));

vi.mock("../src/clients/profile.client.js", () => ({
  getUserIdByUsername: profileClientMocks.getUserIdByUsername,
}));

vi.mock("../src/clients/notification.client.js", () => ({
  createMentionNotification: notificationClientMocks.createMentionNotification,
}));

import { notifyCommentMentionsSafely } from "../src/services/mention-notification.service.js";

describe("mention-notification.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notificationClientMocks.createMentionNotification.mockResolvedValue(undefined);
  });

  describe("notifyCommentMentionsSafely", () => {
    it("envoie une notification quand l'auteur mentionne un autre utilisateur", async () => {
      profileClientMocks.getUserIdByUsername.mockResolvedValue("user-b");

      notifyCommentMentionsSafely("user-a", "comment-123", "Salut @alice !");
      await vi.waitFor(() => {
        expect(notificationClientMocks.createMentionNotification).toHaveBeenCalled();
      });

      expect(notificationClientMocks.createMentionNotification).toHaveBeenCalledWith({
        recipientId: "user-b",
        actorId: "user-a",
        resourceType: "comment",
        resourceId: "comment-123",
      });
    });

    it("n'envoie pas de notification en self-mention", async () => {
      profileClientMocks.getUserIdByUsername.mockResolvedValue("user-a");

      notifyCommentMentionsSafely("user-a", "comment-123", "Salut @alice !");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(notificationClientMocks.createMentionNotification).not.toHaveBeenCalled();
    });

    it("ignore un username inconnu", async () => {
      profileClientMocks.getUserIdByUsername.mockResolvedValue(null);

      notifyCommentMentionsSafely("user-a", "comment-123", "Salut @unknown !");
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(notificationClientMocks.createMentionNotification).not.toHaveBeenCalled();
    });

    it("deduplique les mentions", async () => {
      profileClientMocks.getUserIdByUsername.mockResolvedValue("user-b");

      notifyCommentMentionsSafely(
        "user-a",
        "comment-123",
        "@alice @alice @ALICE"
      );
      await vi.waitFor(() => {
        expect(notificationClientMocks.createMentionNotification).toHaveBeenCalledTimes(1);
      });
    });

    it("n'échoue pas si notification-service est indisponible", async () => {
      profileClientMocks.getUserIdByUsername.mockResolvedValue("user-b");
      notificationClientMocks.createMentionNotification.mockRejectedValue(
        new Error("notification-service down")
      );
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      notifyCommentMentionsSafely("user-a", "comment-123", "Salut @alice !");
      await vi.waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
