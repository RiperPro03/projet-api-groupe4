import { env } from "../config/env.js";

export type CreateMentionNotificationInput = {
  recipientId: string;
  actorId: string;
  resourceType: "post" | "comment";
  resourceId: string;
};

export async function createMentionNotification(
  input: CreateMentionNotificationInput
): Promise<void> {
  const response = await fetch(`${env.notificationServiceUrl}/notifications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      recipientId: input.recipientId,
      actorId: input.actorId,
      type: "mention",
      resourceType: input.resourceType,
      resourceId: input.resourceId,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `notification-service responded with status ${response.status}`
    );
  }
}
