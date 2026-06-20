import { httpClient } from "./http-client";

export type PublicProfile = {
  id_user: string;
  username: string;
  nickname: string;
  bio: string;
  url_photo: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Recherche dynamique par username (partiel, insensible à la casse)
 * GET /api/profiles/search?username=a
 * Retourne { status, data: PublicProfile[] }
 */
export async function searchProfilesByUsername(
  username: string
): Promise<PublicProfile[]> {
  if (!username.trim()) return [];

  const { data } = await httpClient.get<{ status: string; data: PublicProfile[] }>(
    "/profiles/search",
    { params: { username } }
  );

  return Array.isArray(data.data) ? data.data : [];
}

/**
 * Profil complet par username exact
 * GET /api/profiles/username/:username
 * Retourne { status, data: PublicProfile }
 */
export async function getProfileByUsername(
  username: string
): Promise<PublicProfile | null> {
  try {
    const { data } = await httpClient.get<{ status: string; data: PublicProfile }>(
      `/profiles/username/${encodeURIComponent(username)}`
    );
    return data.data ?? null;
  } catch (err: unknown) {
    const e = err as { response?: { status?: number } };
    if (e?.response?.status === 404) return null;
    throw err;
  }
}

/**
 * Vérifie si currentUserId suit targetUserId
 * GET /api/follows/following?followerId=xxx → tableau de follows
 */
export async function getFollowStatus(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  try {
    const { data } = await httpClient.get<
      { follower_id: string; following_id: string }[]
    >("/follows/following", { params: { followerId: currentUserId } });

    return data.some((f) => f.following_id === targetUserId);
  } catch {
    return false;
  }
}

/**
 * Suivre un utilisateur
 * POST /api/follows  body: { followerId, followingId }
 */
export async function followUser(
  currentUserId: string,
  targetUserId: string
): Promise<void> {
  await httpClient.post("/follows", {
    followerId: currentUserId,
    followingId: targetUserId,
  });
}

/**
 * Ne plus suivre un utilisateur
 * DELETE /api/follows  body: { followerId, followingId }
 */
export async function unfollowUser(
  currentUserId: string,
  targetUserId: string
): Promise<void> {
  await httpClient.delete("/follows", {
    data: {
      followerId: currentUserId,
      followingId: targetUserId,
    },
  });
}