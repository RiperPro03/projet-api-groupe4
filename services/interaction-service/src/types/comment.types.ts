export type CreateCommentInput = {
  postId: string;
  authorId: string;
  content: string;
  parentCommentId?: string | null;
};

export type CommentResponse = {
  id: string;
  postId: string;
  authorId: string;
  parentCommentId?: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
};
