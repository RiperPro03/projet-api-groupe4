import { describe, expect, it } from "vitest";

import { PresenceService } from "../src/services/presence.service.js";

describe("PresenceService", () => {
  it("keeps a user online until their last socket disconnects", () => {
    const presence = new PresenceService();

    expect(presence.connect("user-1", "socket-1").isFirstConnection).toBe(true);
    expect(presence.connect("user-1", "socket-2").isFirstConnection).toBe(false);
    expect(presence.isOnline("user-1")).toBe(true);
    expect(presence.getOnlineUserIds()).toEqual(["user-1"]);

    expect(presence.disconnect("socket-1")).toEqual({
      userId: "user-1",
      wentOffline: false,
    });
    expect(presence.isOnline("user-1")).toBe(true);

    expect(presence.disconnect("socket-2")).toEqual({
      userId: "user-1",
      wentOffline: true,
    });
    expect(presence.isOnline("user-1")).toBe(false);
  });
});
