import prisma from "../config/database.js";
import { Prisma } from "../generated/prisma/client.js";

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
    return await prisma.follow.create({
      data: {
        follower_id: followerId,
        following_id: followingId,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new FollowError("Cet abonnement existe déjà", 409);
    }
    throw error;
  }
}

export async function unfollow(
  followerId: string,
  followingId: string
): Promise<void> {
  try {
    await prisma.follow.delete({
      where: {
        follower_id_following_id: {
          follower_id: followerId,
          following_id: followingId,
        },
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new FollowError("Abonnement introuvable", 404);
    }
    throw error;
  }
}

export async function getFollowing(userId: string) {
  return prisma.follow.findMany({
    where: { follower_id: userId },
    orderBy: { created_at: "desc" },
  });
}

export async function getFollowers(userId: string) {
  return prisma.follow.findMany({
    where: { following_id: userId },
    orderBy: { created_at: "desc" },
  });
}
