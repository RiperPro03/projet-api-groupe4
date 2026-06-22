import { env } from "../config/env.js";

export type CreateLikeNotificationInput = {
  recipientId: string;
  actorId: string;
  resourceType: "post" | "comment";
  resourceId: string;
  postId?: string;
};

export async function createLikeNotification(
  input: CreateLikeNotificationInput
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
      type: "like",
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      postId: input.postId,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `notification-service responded with status ${response.status}`
    );
  }
}
