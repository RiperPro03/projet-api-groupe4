import { beforeEach, describe, expect, it, vi } from "vitest";

const commentMocks = vi.hoisted(() => ({
  deleteMany: vi.fn(),
}));

const postLikeMocks = vi.hoisted(() => ({
  deleteMany: vi.fn(),
}));

const commentLikeMocks = vi.hoisted(() => ({
  deleteMany: vi.fn(),
}));

vi.mock("../src/models/comment.model.js", () => ({
  Comment: {
    deleteMany: commentMocks.deleteMany,
  },
}));

vi.mock("../src/models/post-like.model.js", () => ({
  PostLike: {
    deleteMany: postLikeMocks.deleteMany,
  },
}));

vi.mock("../src/models/comment-like.model.js", () => ({
  CommentLike: {
    deleteMany: commentLikeMocks.deleteMany,
  },
}));

import { deletePostInteractions } from "../src/services/post-interaction-cleanup.service.js";

describe("post-interaction-cleanup.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("supprime les commentaires, likes de post et likes de commentaires", async () => {
    commentMocks.deleteMany.mockResolvedValue({ deletedCount: 2 });
    postLikeMocks.deleteMany.mockResolvedValue({ deletedCount: 3 });
    commentLikeMocks.deleteMany.mockResolvedValue({ deletedCount: 4 });

    const result = await deletePostInteractions(" post-123 ");

    expect(result).toEqual({
      commentsDeletedCount: 2,
      postLikesDeletedCount: 3,
      commentLikesDeletedCount: 4,
    });
    expect(commentMocks.deleteMany).toHaveBeenCalledWith({ postId: "post-123" });
    expect(postLikeMocks.deleteMany).toHaveBeenCalledWith({ postId: "post-123" });
    expect(commentLikeMocks.deleteMany).toHaveBeenCalledWith({
      postId: "post-123",
    });
  });

  it("refuse un postId vide", async () => {
    await expect(deletePostInteractions("  ")).rejects.toMatchObject({
      statusCode: 400,
      message: "postId est requis",
    });
    expect(commentMocks.deleteMany).not.toHaveBeenCalled();
    expect(postLikeMocks.deleteMany).not.toHaveBeenCalled();
    expect(commentLikeMocks.deleteMany).not.toHaveBeenCalled();
  });
});
