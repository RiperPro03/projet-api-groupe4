import { beforeEach, describe, expect, it, vi } from "vitest";

const postMocks = vi.hoisted(() => ({
  create: vi.fn(),
  findById: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  find: vi.fn(),
}));

const mentionMocks = vi.hoisted(() => ({
  resolveMentionedUserIds: vi.fn(),
  notifyPostMentionsSafely: vi.fn(),
}));

const interactionMocks = vi.hoisted(() => ({
  deletePostInteractions: vi.fn(),
}));

vi.mock("../src/models/post.model", () => ({
  Post: {
    create: postMocks.create,
    findById: postMocks.findById,
    findByIdAndUpdate: postMocks.findByIdAndUpdate,
    find: postMocks.find,
  },
}));

vi.mock("../src/services/mention-notification.service", () => ({
  resolveMentionedUserIds: mentionMocks.resolveMentionedUserIds,
  notifyPostMentionsSafely: mentionMocks.notifyPostMentionsSafely,
}));

vi.mock("../src/clients/interaction.client", () => ({
  deletePostInteractions: interactionMocks.deletePostInteractions,
}));

import postService from "../src/services/post.service";

const createPostDocument = (overrides: Record<string, unknown> = {}) => ({
  _id: "post-123",
  authorId: "user-a",
  content: "Post demo",
  tags: ["demo"],
  media: [],
  createdAt: new Date("2026-06-22T10:00:00.000Z"),
  updatedAt: new Date("2026-06-22T10:01:00.000Z"),
  deletedAt: null,
  save: vi.fn(),
  ...overrides,
});

const createFindChain = (posts: unknown[]) => ({
  sort: vi.fn().mockReturnValue({
    limit: vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue(posts),
    }),
  }),
});

describe("post.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mentionMocks.resolveMentionedUserIds.mockResolvedValue([]);
    interactionMocks.deletePostInteractions.mockResolvedValue(undefined);
  });

  it("cree un post, trim le contenu et notifie les mentions", async () => {
    postMocks.create.mockResolvedValue(createPostDocument({ content: "Salut @lea" }));

    const post = await postService.createPost("user-a", {
      content: "  Salut @lea  ",
      tags: ["demo"],
    });

    expect(post.id).toBe("post-123");
    expect(postMocks.create).toHaveBeenCalledWith({
      authorId: "user-a",
      content: "Salut @lea",
      tags: ["demo"],
      media: [],
    });
    expect(mentionMocks.resolveMentionedUserIds).toHaveBeenCalledWith(
      "Salut @lea",
      "user-a",
    );
    expect(mentionMocks.notifyPostMentionsSafely).toHaveBeenCalledWith(
      "user-a",
      "post-123",
      "Salut @lea",
    );
  });

  it("liste une page de posts par auteur", async () => {
    postMocks.find.mockReturnValue(
      createFindChain([
        createPostDocument({ _id: "post-1" }),
        createPostDocument({ _id: "post-2" }),
      ]),
    );

    const page = await postService.getPostsByAuthor("user-a", 1);

    expect(page.posts).toHaveLength(1);
    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toBe("post-1");
    expect(postMocks.find).toHaveBeenCalledWith({
      authorId: "user-a",
      deletedAt: null,
    });
  });

  it("retourne un post par id", async () => {
    postMocks.findById.mockResolvedValue(createPostDocument());

    const post = await postService.getPostById("post-123");

    expect(post.id).toBe("post-123");
    expect(post.authorId).toBe("user-a");
  });

  it("retourne POST_NOT_FOUND quand le post est absent", async () => {
    postMocks.findById.mockResolvedValue(null);

    await expect(postService.getPostById("missing")).rejects.toThrow(
      "POST_NOT_FOUND",
    );
  });

  it("met a jour un post", async () => {
    postMocks.findByIdAndUpdate.mockResolvedValue(
      createPostDocument({ content: "Post modifie" }),
    );

    const post = await postService.updatePost("post-123", {
      content: "Post modifie",
      tags: ["edited"],
    });

    expect(post.content).toBe("Post modifie");
    expect(postMocks.findByIdAndUpdate).toHaveBeenCalledWith(
      "post-123",
      { content: "Post modifie", tags: ["edited"], media: undefined },
      { returnDocument: "after", runValidators: true },
    );
  });

  it("soft delete un post appartenant au demandeur", async () => {
    const document = createPostDocument();
    postMocks.findById.mockResolvedValue(document);

    const post = await postService.softDeletePost("post-123", "user-a");

    expect(post.deletedAt).toBeInstanceOf(Date);
    expect(document.save).toHaveBeenCalled();
    expect(interactionMocks.deletePostInteractions).toHaveBeenCalledWith(
      "post-123",
    );
  });

  it.each(["MODERATOR", "ADMIN"])(
    "soft delete un post par un %s meme si ce n'est pas l'auteur",
    async (role) => {
      const document = createPostDocument();
      postMocks.findById.mockResolvedValue(document);

      const post = await postService.softDeletePost("post-123", "user-b", role);

      expect(post.deletedAt).toBeInstanceOf(Date);
      expect(document.save).toHaveBeenCalled();
      expect(interactionMocks.deletePostInteractions).toHaveBeenCalledWith(
        "post-123",
      );
    },
  );

  it("nettoie les interactions meme si le post est deja supprime", async () => {
    const deletedAt = new Date("2026-06-23T10:00:00.000Z");
    const document = createPostDocument({ deletedAt });
    postMocks.findById.mockResolvedValue(document);

    const post = await postService.softDeletePost("post-123", "user-a");

    expect(post.deletedAt).toBe(deletedAt);
    expect(document.save).not.toHaveBeenCalled();
    expect(interactionMocks.deletePostInteractions).toHaveBeenCalledWith(
      "post-123",
    );
  });

  it("refuse le soft delete par un autre auteur", async () => {
    postMocks.findById.mockResolvedValue(createPostDocument());

    await expect(
      postService.softDeletePost("post-123", "user-b"),
    ).rejects.toThrow("POST_FORBIDDEN");
    expect(interactionMocks.deletePostInteractions).not.toHaveBeenCalled();
  });

  it("refuse le soft delete sans demandeur authentifie", async () => {
    postMocks.findById.mockResolvedValue(createPostDocument());

    await expect(postService.softDeletePost("post-123")).rejects.toThrow(
      "POST_FORBIDDEN",
    );
    expect(interactionMocks.deletePostInteractions).not.toHaveBeenCalled();
  });
});
