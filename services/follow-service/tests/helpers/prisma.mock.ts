//version simulée de PrismaClient pour les tests

export function createFollowRecord(
  followerId: string,
  followingId: string,
  id = "test-uuid"
) {
  return {
    id,
    follower_id: followerId,
    following_id: followingId,
    created_at: new Date("2026-06-08T12:00:00.000Z"),
  };
}
