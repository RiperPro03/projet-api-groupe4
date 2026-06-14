import { Like, type TargetType, TARGET_TYPES } from "../models/like.model.js";

/** Erreur métier avec un code HTTP associé (utilisée par le controller). */
export class LikeError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "LikeError";
  }
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: number }).code === 11000
  );
}

export function isTargetType(value: string): value is TargetType {
  return (TARGET_TYPES as readonly string[]).includes(value);
}

/** Ajoute un like sur une cible (post, commentaire ou réponse). */
export async function addLike(
  userId: string,
  targetType: TargetType,
  targetId: string,
  postId?: string
) {
  if (!userId.trim()) {
    throw new LikeError("userId est requis", 400);
  }

  if (!targetId.trim()) {
    throw new LikeError("targetId est requis", 400);
  }

  const resolvedPostId =
    targetType === "post" ? targetId.trim() : postId?.trim();

  try {
    return await Like.create({
      userId: userId.trim(),
      targetType,
      targetId: targetId.trim(),
      ...(resolvedPostId ? { postId: resolvedPostId } : {}),
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new LikeError("Ce like existe déjà", 409);
    }
    throw error;
  }
}

/** Retire un like existant. */
export async function removeLike(
  userId: string,
  targetType: TargetType,
  targetId: string
): Promise<void> {
  if (!userId.trim()) {
    throw new LikeError("userId est requis", 400);
  }

  const deleted = await Like.findOneAndDelete({
    userId: userId.trim(),
    targetType,
    targetId: targetId.trim(),
  });

  if (!deleted) {
    throw new LikeError("Like introuvable", 404);
  }
}

/** Compte les likes d'une cible. */
export async function countLikes(
  targetType: TargetType,
  targetId: string
): Promise<number> {
  if (!targetId.trim()) {
    throw new LikeError("targetId est requis", 400);
  }

  return Like.countDocuments({
    targetType,
    targetId: targetId.trim(),
  });
}
