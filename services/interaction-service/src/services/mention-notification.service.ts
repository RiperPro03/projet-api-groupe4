import { createMentionNotification } from "../clients/notification.client.js";
import { getUserIdByUsername } from "../clients/profile.client.js";
import { extractMentionUsernames } from "../utils/mention.utils.js";

async function notifyCommentMentions(
  actorId: string,
  commentId: string,
  content: string
): Promise<void> {
  const usernames = extractMentionUsernames(content);
  const recipientIds = new Set<string>();

  for (const username of usernames) {
    const userId = await getUserIdByUsername(username);

    if (!userId || userId === actorId) {
      continue;
    }

    recipientIds.add(userId);
  }

  for (const recipientId of recipientIds) {
    await createMentionNotification({
      recipientId,
      actorId,
      resourceType: "comment",
      resourceId: commentId,
    });
  }
}

export function notifyCommentMentionsSafely(
  actorId: string,
  commentId: string,
  content: string
): void {
  void notifyCommentMentions(actorId, commentId, content).catch((error) => {
    console.error("Failed to create comment mention notifications:", error);
  });
}
