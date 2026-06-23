import axios from "axios";
import { internalHttpClient } from "./internal-http.client.js";

export type CreateFollowNotificationInput = {
  recipientId: string;
  actorId: string;
};

function getNotificationErrorStatus(error: unknown): number | "unknown" {
  if (axios.isAxiosError(error) && error.response?.status) {
    return error.response.status;
  }

  return "unknown";
}

export async function createFollowNotification(
  input: CreateFollowNotificationInput
): Promise<void> {
  try {
    await internalHttpClient.post("/notifications", {
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: "follow",
      resourceType: "user",
      resourceId: input.actorId,
    });
  } catch (error) {
    throw new Error(
      `notification-service responded with status ${getNotificationErrorStatus(error)}`
    );
  }
}
