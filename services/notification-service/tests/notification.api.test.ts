import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

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

import app from "../src/app.js";
import {
  createLikeNotificationInput,
  createMentionNotificationInput,
  createNotificationDocument,
} from "./helpers/notification.mock.js";

describe("notification API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /health", () => {
    it("retourne 200", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("OK");
    });
  });

  describe("POST /notifications", () => {
    it("crée une notification", async () => {
      notificationMocks.create.mockResolvedValue(createNotificationDocument());

      const response = await request(app)
        .post("/notifications")
        .send(createLikeNotificationInput());

      expect(response.status).toBe(201);
      expect(response.body.status).toBe("success");
      expect(response.body.data.notification.resourceType).toBe("post");
    });

    it("retourne 400 via le middleware", async () => {
      const response = await request(app).post("/notifications").send({
        recipientId: "user-a",
        actorId: "user-a",
        type: "like",
        resourceType: "post",
        resourceId: "post-123",
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        "recipientId et actorId ne peuvent pas être identiques"
      );
    });

    it("crée une notification de mention", async () => {
      notificationMocks.create.mockResolvedValue(
        createNotificationDocument({
          type: "mention",
          message: "Un utilisateur vous a mentionné dans un post",
        })
      );

      const response = await request(app)
        .post("/notifications")
        .send(createMentionNotificationInput());

      expect(response.status).toBe(201);
      expect(response.body.data.notification.type).toBe("mention");
    });
  });

  describe("GET /notifications/unread-count", () => {
    it("retourne le compteur", async () => {
      notificationMocks.countDocuments.mockResolvedValue(4);

      const response = await request(app)
        .get("/notifications/unread-count")
        .query({ recipientId: "user-b" });

      expect(response.status).toBe(200);
      expect(response.body.data.count).toBe(4);
    });

    it("retourne 400 si recipientId est absent", async () => {
      const response = await request(app).get("/notifications/unread-count");

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("recipientId est requis");
    });
  });

  describe("PATCH /notifications/:id/read", () => {
    it("retourne 404 via le middleware", async () => {
      notificationMocks.findByIdAndUpdate.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      });

      const response = await request(app).patch(
        "/notifications/507f1f77bcf86cd799439011/read"
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Notification introuvable");
    });
  });

  describe("routes inconnues", () => {
    it("retourne 404", async () => {
      const response = await request(app).get("/unknown-route");

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Route introuvable");
    });
  });
});
