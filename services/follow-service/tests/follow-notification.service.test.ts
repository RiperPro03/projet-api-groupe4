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
    notificationClientMocks.createFollowNotification.mockResolvedValue(undefined);
  });

  it("envoie une notification quand un utilisateur en suit un autre", async () => {
    notifyFollowSafely("user-a", "user-b");

    await vi.waitFor(() => {
      expect(notificationClientMocks.createFollowNotification).toHaveBeenCalled();
    });

    expect(notificationClientMocks.createFollowNotification).toHaveBeenCalledWith({
      recipientId: "user-b",
      actorId: "user-a",
    });
  });

  it("n'interrompt pas le flux si la notification échoue", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    notificationClientMocks.createFollowNotification.mockRejectedValue(
      new Error("notification-service down")
    );

    notifyFollowSafely("user-a", "user-b");

    await vi.waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });
});
