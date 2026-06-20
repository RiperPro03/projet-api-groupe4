import { httpClient, isApiStatusCode } from "./http-client";

export type PublicProfile = {
  id_user: string;
  username: string;
  nickname: string;
  bio: string;
  url_photo: string;
  createdAt: string;
  updatedAt: string;
};

type FollowRelation = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type FollowStats = {
  followersCount: number;
  followingCount: number;
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
    const { data } = await httpClient.get<FollowRelation[]>("/follows/following", {
      params: { followerId: currentUserId },
    });

    return data.some((f) => f.following_id === targetUserId);
  } catch {
    return false;
  }
}

export async function getProfileById(
  userId: string
): Promise<PublicProfile | null> {
  try {
    const { data } = await httpClient.get<{ status: string; data: PublicProfile }>(
      `/profiles/${encodeURIComponent(userId)}`
    );
    return data.data ?? null;
  } catch (err: unknown) {
    const e = err as { response?: { status?: number } };
    if (e?.response?.status === 404) return null;
    throw err;
  }
}

export async function getFollowStats(userId: string): Promise<FollowStats> {
  try {
    const [followersResponse, followingResponse] = await Promise.all([
      httpClient.get<FollowRelation[]>("/follows/followers", {
        params: { followingId: userId },
      }),
      httpClient.get<FollowRelation[]>("/follows/following", {
        params: { followerId: userId },
      }),
    ]);

    return {
      followersCount: followersResponse.data.length,
      followingCount: followingResponse.data.length,
    };
  } catch {
    return {
      followersCount: 0,
      followingCount: 0,
    };
  }
}

async function getProfilesFromFollowIds(userIds: string[]) {
  const profiles = await Promise.all(
    userIds.map((userId) => getProfileById(userId).catch(() => null))
  );

  return profiles.filter((profile): profile is PublicProfile => profile !== null);
}

export async function getFollowersProfiles(userId: string): Promise<PublicProfile[]> {
  const { data } = await httpClient.get<FollowRelation[]>("/follows/followers", {
    params: { followingId: userId },
  });

  return getProfilesFromFollowIds(data.map((follow) => follow.follower_id));
}

export async function getFollowingProfiles(userId: string): Promise<PublicProfile[]> {
  const { data } = await httpClient.get<FollowRelation[]>("/follows/following", {
    params: { followerId: userId },
  });

  return getProfilesFromFollowIds(data.map((follow) => follow.following_id));
}

/**
 * Suivre un utilisateur
 * POST /api/follows  body: { followerId, followingId }
 */
export async function followUser(
  currentUserId: string,
  targetUserId: string
): Promise<void> {
  try {
    await httpClient.post("/follows", {
      followerId: currentUserId,
      followingId: targetUserId,
    });
  } catch (error) {
    if (isApiStatusCode(error, 409)) {
      return;
    }

    throw error;
  }
}

/**
 * Ne plus suivre un utilisateur
 * DELETE /api/follows  body: { followerId, followingId }
 */
export async function unfollowUser(
  currentUserId: string,
  targetUserId: string
): Promise<void> {
  try {
    await httpClient.delete("/follows", {
      data: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    });
  } catch (error) {
    if (isApiStatusCode(error, 404)) {
      return;
    }

    throw error;
  }
}
