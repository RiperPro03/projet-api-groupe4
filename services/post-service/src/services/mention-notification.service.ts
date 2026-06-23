import { createMentionNotification } from "../clients/notification.client.js";
import { getUserIdByUsername } from "../clients/profile.client.js";
import { getUserIdsByRole } from "../clients/user.client.js";
import {
  extractIndividualMentionUsernames,
  extractRoleMentions,
} from "../utils/mention.utils.js";

export async function resolveMentionedUserIds(
  content: string,
  actorId: string
): Promise<string[]> {
  const recipientIds = new Set<string>();

  for (const username of extractIndividualMentionUsernames(content)) {
    const userId = await getUserIdByUsername(username);

    if (!userId || userId === actorId) {
      continue;
    }

    recipientIds.add(userId);
  }

  for (const role of extractRoleMentions(content)) {
    const userIds = await getUserIdsByRole(role);

    for (const userId of userIds) {
      if (userId !== actorId) {
        recipientIds.add(userId);
      }
    }
  }

  return Array.from(recipientIds);
}

async function notifyPostMentions(
  actorId: string,
  postId: string,
  content: string
): Promise<void> {
  const recipientIds = await resolveMentionedUserIds(content, actorId);

  for (const recipientId of recipientIds) {
    await createMentionNotification({
      recipientId,
      actorId,
      resourceType: "post",
      resourceId: postId,
    });
  }
}

export function notifyPostMentionsSafely(
  actorId: string,
  postId: string,
  content: string
): void {
  void notifyPostMentions(actorId, postId, content).catch((error) => {
    console.error("Failed to create post mention notifications:", error);
  });
}
