import prisma from "../config/database.js";
import { Prisma } from "../generated/prisma/client.js";

/** Erreur métier avec un code HTTP associé (utilisée par le controller). */
export class FollowError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "FollowError";
  }
}

/** Crée la relation followerId → followingId (Fx9). */
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
    // P2002 = violation de contrainte unique (déjà suivi).
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new FollowError("Cet abonnement existe déjà", 409);
    }
    throw error;
  }
}

/**
 * Supprime une seule relation, identifiée par la paire (follower, following).
 * La clé composée @@unique([follower_id, following_id]) dans Prisma
 * garantit qu'on ne supprime pas tous les follows d'un utilisateur.
 */
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
    // P2025 = enregistrement introuvable.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new FollowError("Abonnement introuvable", 404);
    }
    throw error;
  }
}

/** Liste des utilisateurs suivis par userId (feed-service s'en sert). */
export async function getFollowing(userId: string) {
  return prisma.follow.findMany({
    where: { follower_id: userId },
    orderBy: { created_at: "desc" },
  });
}

/** Liste des abonnés de userId. */
export async function getFollowers(userId: string) {
  return prisma.follow.findMany({
    where: { following_id: userId },
    orderBy: { created_at: "desc" },
  });
}
