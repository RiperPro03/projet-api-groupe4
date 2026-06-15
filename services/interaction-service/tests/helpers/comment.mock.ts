type CreateCommentRecordInput = {
  id?: string;
  postId: string;
  userId: string;
  content: string;
  parentCommentId?: string | null;
  deletedAt?: Date | null;
  save?: () => Promise<unknown>;
};

const createdAt = new Date("2026-06-08T12:00:00.000Z");
const updatedAt = new Date("2026-06-08T12:30:00.000Z");

export function createCommentRecord({
  id = "comment-1",
  postId,
  userId,
  content,
  parentCommentId = null,
  deletedAt = null,
  save = async () => undefined,
}: CreateCommentRecordInput) {
  const record = {
    _id: id,
    postId,
    userId,
    content,
    parentCommentId,
    deletedAt,
    createdAt,
    updatedAt,
    save,
  };

  return record;
}
