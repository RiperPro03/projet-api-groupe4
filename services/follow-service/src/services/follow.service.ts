import { UniqueConstraintError } from "sequelize";
import Follow from "../models/follow.model.js";

export class FollowError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "FollowError";
  }
}

export async function addFollow(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new FollowError(
      "Un utilisateur ne peut pas se suivre lui-même",
      400
    );
  }

  try {
    return await Follow.create({
      follower_id: followerId,
      following_id: followingId,
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new FollowError("Cet abonnement existe déjà", 409);
    }
    throw error;
  }
}

export async function unfollow(
  followerId: string,
  followingId: string
): Promise<void> {
  const deleted = await Follow.destroy({
    where: {
      follower_id: followerId,
      following_id: followingId,
    },
  });

  if (deleted === 0) {
    throw new FollowError("Abonnement introuvable", 404);
  }
}

export async function getFollowing(userId: string) {
  return Follow.findAll({
    where: { follower_id: userId },
    order: [["created_at", "DESC"]],
  });
}

export async function getFollowers(userId: string) {
  return Follow.findAll({
    where: { following_id: userId },
    order: [["created_at", "DESC"]],
  });
}
