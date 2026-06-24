import type { Comment } from "@/types/comment";

export function countRootComments(comments: Comment[]) {
  return comments.filter((comment) => !comment.parentCommentId).length;
}

export function getCommentBranchIds(comments: Comment[], commentId: string) {
  const branchIds = new Set<string>([commentId]);
  let addedComment = true;

  // Comments are stored as a flat list, so deletion helpers rebuild the
  // branch that starts at the selected comment before updating local state.
  while (addedComment) {
    addedComment = false;

    comments.forEach((comment) => {
      if (
        comment.parentCommentId &&
        branchIds.has(comment.parentCommentId) &&
        !branchIds.has(comment.id)
      ) {
        branchIds.add(comment.id);
        addedComment = true;
      }
    });
  }

  return branchIds;
}

export function removeCommentBranch(comments: Comment[], commentId: string) {
  const commentToRemove = comments.find((comment) => comment.id === commentId);
  const branchIds = getCommentBranchIds(comments, commentId);

  return comments
    .filter((comment) => !branchIds.has(comment.id))
    .map((comment) =>
      commentToRemove?.parentCommentId === comment.id
        ? {
            ...comment,
            repliesCount: Math.max(0, comment.repliesCount - 1),
          }
        : comment
    );
}
