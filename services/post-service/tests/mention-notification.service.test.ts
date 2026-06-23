import { beforeEach, describe, expect, it, vi } from "vitest";

const profileClientMocks = vi.hoisted(() => ({
  getUserIdByUsername: vi.fn(),
}));

const userClientMocks = vi.hoisted(() => ({
  getUserIdsByRole: vi.fn(),
}));

const notificationClientMocks = vi.hoisted(() => ({
  createMentionNotification: vi.fn(),
}));

vi.mock("../src/clients/profile.client.js", () => ({
  getUserIdByUsername: profileClientMocks.getUserIdByUsername,
}));

vi.mock("../src/clients/user.client.js", () => ({
  getUserIdsByRole: userClientMocks.getUserIdsByRole,
}));

vi.mock("../src/clients/notification.client.js", () => ({
  createMentionNotification: notificationClientMocks.createMentionNotification,
}));

import {
  notifyPostMentionsSafely,
  resolveMentionedUserIds,
} from "../src/services/mention-notification.service.js";

describe("mention-notification.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notificationClientMocks.createMentionNotification.mockResolvedValue(undefined);
    userClientMocks.getUserIdsByRole.mockResolvedValue([]);
  });

  describe("resolveMentionedUserIds", () => {
    it("retourne les ids utilisateurs mentionnés", async () => {
      profileClientMocks.getUserIdByUsername.mockResolvedValue("user-b");

      const result = await resolveMentionedUserIds("Salut @alice", "user-a");

      expect(result).toEqual(["user-b"]);
    });

    it("ignore self-mention et username inconnu", async () => {
      profileClientMocks.getUserIdByUsername
        .mockResolvedValueOnce("user-a")
        .mockResolvedValueOnce(null);

      const result = await resolveMentionedUserIds(
        "@alice @unknown",
        "user-a"
      );

      expect(result).toEqual([]);
    });

    it("retourne les ids des admins et moderateurs mentionnés", async () => {
      userClientMocks.getUserIdsByRole
        .mockResolvedValueOnce(["admin-1"])
        .mockResolvedValueOnce(["mod-1"]);

      const result = await resolveMentionedUserIds(
        "Besoin de vous @admin @moderator",
        "user-a",
      );

      expect(userClientMocks.getUserIdsByRole).toHaveBeenNthCalledWith(1, "ADMIN");
      expect(userClientMocks.getUserIdsByRole).toHaveBeenNthCalledWith(
        2,
        "MODERATOR",
      );
      expect(result).toEqual(["admin-1", "mod-1"]);
    });
  });

  describe("notifyPostMentionsSafely", () => {
    it("envoie une notification de mention post", async () => {
      profileClientMocks.getUserIdByUsername.mockResolvedValue("user-b");

      notifyPostMentionsSafely("user-a", "post-123", "Salut @alice !");
      await vi.waitFor(() => {
        expect(notificationClientMocks.createMentionNotification).toHaveBeenCalled();
      });

      expect(notificationClientMocks.createMentionNotification).toHaveBeenCalledWith({
        recipientId: "user-b",
        actorId: "user-a",
        resourceType: "post",
        resourceId: "post-123",
      });
    });

    it("envoie des notifications pour @admin et @moderator", async () => {
      userClientMocks.getUserIdsByRole
        .mockResolvedValueOnce(["admin-1"])
        .mockResolvedValueOnce(["mod-1"]);

      notifyPostMentionsSafely("user-a", "post-123", "Aide @admin @moderator");
      await vi.waitFor(() => {
        expect(notificationClientMocks.createMentionNotification).toHaveBeenCalledTimes(2);
      });
    });
  });
});
