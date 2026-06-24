import { createFollowNotification } from "../clients/notification.client.js";

async function notifyFollow(
  followerId: string,
  followingId: string
): Promise<void> {
  await createFollowNotification({
    recipientId: followingId,
    actorId: followerId,
    resourceId: followerId,
  });
}

export function notifyFollowSafely(
  followerId: string,
  followingId: string
): void {
  void notifyFollow(followerId, followingId).catch((error) => {
    console.error("Failed to create follow notification:", error);
  });
}
