import { beforeEach, describe, expect, it, vi } from "vitest";

const notificationClientMocks = vi.hoisted(() => ({
  createFollowNotification: vi.fn(),
}));

vi.mock("../src/clients/notification.client.js", () => ({
  createFollowNotification: notificationClientMocks.createFollowNotification,
}));

import { notifyFollowSafely } from "../src/services/follow-notification.service.js";

describe("follow-notification.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notificationClientMocks.createFollowNotification.mockResolvedValue(
      undefined
    );
  });

  it("envoie une notification au compte suivi", async () => {
    notifyFollowSafely("user-a", "user-b");
    await vi.waitFor(() => {
      expect(
        notificationClientMocks.createFollowNotification
      ).toHaveBeenCalled();
    });

    expect(notificationClientMocks.createFollowNotification).toHaveBeenCalledWith(
      {
        recipientId: "user-b",
        actorId: "user-a",
        resourceId: "user-a",
      }
    );
  });

  it("n'échoue pas si notification-service est indisponible", async () => {
    notificationClientMocks.createFollowNotification.mockRejectedValue(
      new Error("notification-service down")
    );
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    notifyFollowSafely("user-a", "user-b");
    await vi.waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });
});
