import { describe, expect, it } from "vitest";

import {
  createPrivateMessage,
  PrivateMessageError,
} from "../src/services/private-message.service.js";

describe("createPrivateMessage", () => {
  it("creates an ephemeral private message payload", () => {
    const message = createPrivateMessage("sender-1", {
      toUserId: "receiver-1",
      content: "Salut",
      clientMessageId: "client-1",
    });

    expect(message).toMatchObject({
      fromUserId: "sender-1",
      toUserId: "receiver-1",
      content: "Salut",
      clientMessageId: "client-1",
    });
    expect(message.id).toEqual(expect.any(String));
    expect(message.sentAt).toEqual(expect.any(String));
  });

  it("rejects self messages", () => {
    expect(() =>
      createPrivateMessage("sender-1", {
        toUserId: "sender-1",
        content: "Nope",
      })
    ).toThrow(PrivateMessageError);
  });

  it("rejects messages above the configured length", () => {
    expect(() =>
      createPrivateMessage(
        "sender-1",
        {
          toUserId: "receiver-1",
          content: "abc",
        },
        2
      )
    ).toThrow("Message cannot exceed 2 characters");
  });
});
