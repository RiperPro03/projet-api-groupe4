import type { TargetType } from "../../src/models/like.model.js";

type CreateLikeRecordInput = {
  userId: string;
  targetType: TargetType;
  targetId: string;
  postId?: string;
  id?: string;
};

export function createLikeRecord({
  userId,
  targetType,
  targetId,
  postId,
  id = "like-1",
}: CreateLikeRecordInput) {
  const resolvedPostId =
    postId ?? (targetType === "post" ? targetId : undefined);

  return {
    _id: id,
    userId,
    targetType,
    targetId,
    ...(resolvedPostId ? { postId: resolvedPostId } : {}),
    createdAt: new Date("2026-06-08T12:00:00.000Z"),
    updatedAt: new Date("2026-06-08T12:00:00.000Z"),
  };
}
