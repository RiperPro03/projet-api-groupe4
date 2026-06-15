type CreatePostLikeRecordInput = {
  userId: string;
  postId: string;
  id?: string;
};

type CreateCommentLikeRecordInput = {
  userId: string;
  commentId: string;
  postId: string;
  id?: string;
};

const createdAt = new Date("2026-06-08T12:00:00.000Z");

export function createPostLikeRecord({
  userId,
  postId,
  id = "post-like-1",
}: CreatePostLikeRecordInput) {
  return {
    _id: id,
    userId,
    postId,
    createdAt,
  };
}

export function createCommentLikeRecord({
  userId,
  commentId,
  postId,
  id = "comment-like-1",
}: CreateCommentLikeRecordInput) {
  return {
    _id: id,
    userId,
    commentId,
    postId,
    createdAt,
  };
}
