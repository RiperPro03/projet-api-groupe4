const MENTION_USERNAME_REGEX = /@([a-zA-Z0-9_]+)/g;
const ADMIN_ROLE_MENTION_TOKENS = new Set(["admin", "admins"]);
const MODERATOR_ROLE_MENTION_TOKENS = new Set(["moderator", "moderators"]);

export type RoleMention = "ADMIN" | "MODERATOR";

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

export function extractRoleMentions(content: string): RoleMention[] {
  const roles = new Set<RoleMention>();

  for (const username of extractMentionUsernames(content)) {
    if (ADMIN_ROLE_MENTION_TOKENS.has(username)) {
      roles.add("ADMIN");
    }

    if (MODERATOR_ROLE_MENTION_TOKENS.has(username)) {
      roles.add("MODERATOR");
    }
  }

  return Array.from(roles);
}

export function extractIndividualMentionUsernames(content: string): string[] {
  return extractMentionUsernames(content).filter(
    (username) =>
      !ADMIN_ROLE_MENTION_TOKENS.has(username) &&
      !MODERATOR_ROLE_MENTION_TOKENS.has(username),
  );
}
