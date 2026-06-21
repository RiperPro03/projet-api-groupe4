import axios from "axios";
import { internalHttpClient } from "./internal-http.client.js";

export type CreateLikeNotificationInput = {
  recipientId: string;
  actorId: string;
  resourceType: "post" | "comment";
  resourceId: string;
};

function getNotificationErrorStatus(error: unknown): number | "unknown" {
  if (axios.isAxiosError(error) && error.response?.status) {
    return error.response.status;
  }

  return "unknown";
}

export async function createLikeNotification(
  input: CreateLikeNotificationInput
): Promise<void> {
  try {
    await internalHttpClient.post("/notifications", {
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: "like",
      resourceType: input.resourceType,
      resourceId: input.resourceId,
    });
  } catch (error) {
    throw new Error(
      `notification-service responded with status ${getNotificationErrorStatus(error)}`
    );
  }
}

export type CreateMentionNotificationInput = {
  recipientId: string;
  actorId: string;
  resourceType: "post" | "comment";
  resourceId: string;
};

export async function createMentionNotification(
  input: CreateMentionNotificationInput
): Promise<void> {
  try {
    await internalHttpClient.post("/notifications", {
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: "mention",
      resourceType: input.resourceType,
      resourceId: input.resourceId,
    });
  } catch (error) {
    throw new Error(
      `notification-service responded with status ${getNotificationErrorStatus(error)}`
    );
  }
}
