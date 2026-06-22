import { beforeEach, describe, expect, it, vi } from "vitest";

const notificationMocks = vi.hoisted(() => ({
  create: vi.fn(),
  find: vi.fn(),
  countDocuments: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  updateMany: vi.fn(),
  findByIdAndDelete: vi.fn(),
}));

vi.mock("../src/models/notification.model.js", () => ({
  Notification: {
    create: notificationMocks.create,
    find: notificationMocks.find,
    countDocuments: notificationMocks.countDocuments,
    findByIdAndUpdate: notificationMocks.findByIdAndUpdate,
    updateMany: notificationMocks.updateMany,
    findByIdAndDelete: notificationMocks.findByIdAndDelete,
  },
}));

import {
  countUnreadNotifications,
  createNotification,
  deleteNotification,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NotificationError,
} from "../src/services/notification.service.js";
import {
  createLikeNotificationInput,
  createNotificationDocument,
} from "./helpers/notification.mock.js";

describe("notification.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createNotification", () => {
    it("crée une notification de like sur un post", async () => {
      const document = createNotificationDocument();
      notificationMocks.create.mockResolvedValue(document);

      const result = await createNotification(createLikeNotificationInput());

      expect(result.message).toBe("Un utilisateur a aimé votre post");
      expect(notificationMocks.create).toHaveBeenCalledWith({
        recipientId: "user-b",
        actorId: "user-a",
        type: "like",
        resourceType: "post",
        resourceId: "post-123",
        postId: null,
        message: "Un utilisateur a aimé votre post",
        isRead: false,
        readAt: null,
      });
    });

    it("crée une notification de like sur un commentaire", async () => {
      const document = createNotificationDocument({
        resourceType: "comment",
        resourceId: "comment-123",
        message: "Un utilisateur a aimé votre commentaire",
      });
      notificationMocks.create.mockResolvedValue(document);

      const result = await createNotification(
        createLikeNotificationInput({
          resourceType: "comment",
          resourceId: "comment-123",
          postId: "post-123",
        })
      );

      expect(result.message).toBe("Un utilisateur a aimé votre commentaire");
    });

    it("refuse un like de commentaire sans postId", async () => {
      await expect(
        createNotification(
          createLikeNotificationInput({
            resourceType: "comment",
            resourceId: "comment-123",
          })
        )
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "postId est requis",
      });
    });

    it("refuse un recipientId vide", async () => {
      await expect(
        createNotification(
          createLikeNotificationInput({ recipientId: "  " })
        )
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "recipientId est requis",
      });
    });

    it("refuse un self-like", async () => {
      await expect(
        createNotification(
          createLikeNotificationInput({
            recipientId: "user-a",
            actorId: "user-a",
          })
        )
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "recipientId et actorId ne peuvent pas être identiques",
      });
    });

    it("refuse un type invalide", async () => {
      await expect(
        createNotification(
          createLikeNotificationInput({
            type: "follow" as "like",
          })
        )
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "type doit être like",
      });
    });

    it("refus un resourceType invalide", async () => {
      await expect(
        createNotification(
          createLikeNotificationInput({
            resourceType: "user" as "post",
          })
        )
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "resourceType doit être post ou comment",
      });
    });
  });

  describe("listNotifications", () => {
    it("retourne les notifications d'un destinataire", async () => {
      const lean = vi.fn().mockResolvedValue([createNotificationDocument()]);
      notificationMocks.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({ lean }),
        }),
      });

      const result = await listNotifications("user-b");

      expect(result.notifications).toHaveLength(1);
      expect(result.hasMore).toBe(false);
      expect(notificationMocks.find).toHaveBeenCalledWith({
        recipientId: "user-b",
      });
    });

    it("filtre les notifications non lues", async () => {
      const lean = vi.fn().mockResolvedValue([]);
      notificationMocks.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({ lean }),
        }),
      });

      await listNotifications("user-b", { unreadOnly: true });

      expect(notificationMocks.find).toHaveBeenCalledWith({
        recipientId: "user-b",
        isRead: false,
      });
    });
  });

  describe("countUnreadNotifications", () => {
    it("compte les notifications non lues", async () => {
      notificationMocks.countDocuments.mockResolvedValue(3);

      const count = await countUnreadNotifications("user-b");

      expect(count).toBe(3);
      expect(notificationMocks.countDocuments).toHaveBeenCalledWith({
        recipientId: "user-b",
        isRead: false,
      });
    });
  });

  describe("markNotificationAsRead", () => {
    it("marque une notification comme lue", async () => {
      notificationMocks.findByIdAndUpdate.mockReturnValue({
        lean: vi.fn().mockResolvedValue(createNotificationDocument({
          isRead: true,
          readAt: new Date("2026-06-04T11:00:00.000Z"),
        })),
      });

      const result = await markNotificationAsRead("507f1f77bcf86cd799439011");

      expect(result.isRead).toBe(true);
    });

    it("retourne 404 si la notification est introuvable", async () => {
      notificationMocks.findByIdAndUpdate.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      await expect(
        markNotificationAsRead("507f1f77bcf86cd799439011")
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Notification introuvable",
      });
    });
  });

  describe("markAllNotificationsAsRead", () => {
    it("marque toutes les notifications comme lues", async () => {
      notificationMocks.updateMany.mockResolvedValue({ modifiedCount: 2 });

      const updatedCount = await markAllNotificationsAsRead("user-b");

      expect(updatedCount).toBe(2);
    });
  });

  describe("deleteNotification", () => {
    it("supprime une notification", async () => {
      notificationMocks.findByIdAndDelete.mockResolvedValue(
        createNotificationDocument()
      );

      await expect(
        deleteNotification("507f1f77bcf86cd799439011")
      ).resolves.toBeUndefined();
    });

    it("retourne 404 si la notification est introuvable", async () => {
      notificationMocks.findByIdAndDelete.mockResolvedValue(null);

      await expect(
        deleteNotification("507f1f77bcf86cd799439011")
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Notification introuvable",
      });
    });
  });

  describe("NotificationError", () => {
    it("expose un statusCode", () => {
      const error = new NotificationError("test", 418);

      expect(error.statusCode).toBe(418);
      expect(error.message).toBe("test");
    });
  });
});
