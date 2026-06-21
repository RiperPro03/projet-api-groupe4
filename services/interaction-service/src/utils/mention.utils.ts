const MENTION_USERNAME_REGEX = /@([a-zA-Z0-9_]+)/g;

export function extractMentionUsernames(content: string): string[] {
  const matches = content.matchAll(MENTION_USERNAME_REGEX);
  const usernames = new Set<string>();

  for (const match of matches) {
    const username = match[1]?.trim().toLowerCase();

    if (username) {
      usernames.add(username);
    }
  }

  return Array.from(usernames);
}
