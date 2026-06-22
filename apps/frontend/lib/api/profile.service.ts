import { httpClient } from "./http-client";

type ProfileResponse = {
  status: string;
  data?: {
    id_user?: string;
    username?: string;
    nickname?: string;
    url_photo?: string;
  } | null;
};

export type ProfileSummary = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
};

function mapProfile(
  userId: string,
  profile: ProfileResponse["data"]
): ProfileSummary {
  const username = profile?.username?.trim() || userId.slice(0, 12);
  const name = profile?.nickname?.trim() || username;

  return {
    id: profile?.id_user ?? userId,
    name,
    username,
    avatarUrl: profile?.url_photo?.trim() || undefined,
  };
}

function getProfileFallback(userId: string): ProfileSummary {
  return {
    id: userId,
    name: `Utilisateur ${userId.slice(0, 8)}`,
    username: userId.slice(0, 12),
  };
}

export async function fetchProfileByUserId(
  userId: string
): Promise<ProfileSummary> {
  const { data } = await httpClient.get<ProfileResponse>(
    `/profiles/${encodeURIComponent(userId)}`
  );

  if (!data.data) {
    return getProfileFallback(userId);
  }

  return mapProfile(userId, data.data);
}

export async function fetchProfilesByUserIds(
  userIds: string[]
): Promise<Map<string, ProfileSummary>> {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
  const entries = await Promise.all(
    uniqueUserIds.map(async (userId) => {
      try {
        const profile = await fetchProfileByUserId(userId);
        return [userId, profile] as const;
      } catch {
        return [userId, getProfileFallback(userId)] as const;
      }
    })
  );

  return new Map(entries);
}
