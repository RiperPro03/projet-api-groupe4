import crypto from "crypto";

import { env } from "../config/env.js";
import type { PrivateMessage, PrivateMessageInput } from "../types/chat.types.js";

export class PrivateMessageError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "PrivateMessageError";
  }
}

function requireNonEmptyString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new PrivateMessageError("INVALID_PAYLOAD", `${fieldName} is required`);
  }

  return value.trim();
}

export function createPrivateMessage(
  fromUserId: string,
  input: PrivateMessageInput,
  maxLength = env.messageMaxLength
): PrivateMessage {
  const toUserId = requireNonEmptyString(input.toUserId, "toUserId");
  const content = requireNonEmptyString(input.content, "content");
  const clientMessageId =
    typeof input.clientMessageId === "string" && input.clientMessageId.trim()
      ? input.clientMessageId.trim()
      : undefined;

  if (toUserId === fromUserId) {
    throw new PrivateMessageError(
      "INVALID_RECIPIENT",
      "You cannot send a private message to yourself"
    );
  }

  if (content.length > maxLength) {
    throw new PrivateMessageError(
      "MESSAGE_TOO_LONG",
      `Message cannot exceed ${maxLength} characters`
    );
  }

  return {
    id: crypto.randomUUID(),
    fromUserId,
    toUserId,
    content,
    sentAt: new Date().toISOString(),
    ...(clientMessageId ? { clientMessageId } : {}),
  };
}
