import { Post } from "../models/post.model";
import {
    notifyPostMentionsSafely,
    resolveMentionedUserIds,
} from "./mention-notification.service";
import { mergeTagsWithHashtags } from "../utils/tags.utils";
import type {
    CreatePostInput,
    PostPageResponse,
    PostResponse,
} from "../types/post.types";

function sanitizePost(post: InstanceType<typeof Post>): PostResponse {
    return {
        id: String(post._id),
        authorId: post.authorId,
        content: post.content,
        tags: post.tags,
        media: post.media ?? [],
        createdAt: post.createdAt as Date,
        updatedAt: post.updatedAt as Date,
        deletedAt: post.deletedAt,
    };
}

function mapLeanPost(post: {
    _id: unknown;
    authorId: string;
    content: string;
    tags?: string[];
    media?: PostResponse["media"];
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}): PostResponse {
    return {
        id: String(post._id),
        authorId: post.authorId,
        content: post.content,
        tags: post.tags ?? [],
        media: post.media ?? [],
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        deletedAt: post.deletedAt,
    };
}

async function getCursorDate(cursor?: string | null) {
    if (!cursor) {
        return null;
    }

    const cursorPost = await Post.findById(cursor).select("createdAt").lean();

    return cursorPost?.createdAt ?? null;
}

async function findPostPage(
    filter: Record<string, unknown>,
    limit: number,
    cursor?: string | null
): Promise<PostPageResponse> {
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const cursorDate = await getCursorDate(cursor);
    const query = {
        ...filter,
        deletedAt: null,
        ...(cursorDate ? { createdAt: { $lt: cursorDate } } : {}),
    };
    const posts = await Post.find(query)
        .sort({ createdAt: -1 })
        .limit(safeLimit + 1)
        .lean();
    const pageItems = posts.slice(0, safeLimit);
    const hasMore = posts.length > safeLimit;

    return {
        posts: pageItems.map(mapLeanPost),
        nextCursor: hasMore ? String(pageItems.at(-1)?._id) : null,
        hasMore,
    };
}

async function createPost(
    authorId: string,
    data: CreatePostInput
): Promise<PostResponse> {
    const content = data.content.trim();
    const mentions = await resolveMentionedUserIds(content, authorId);
    const tags = mergeTagsWithHashtags(content, data.tags);
    const post = await Post.create({
        authorId,
        content,
        tags,
        media: data.media ?? [],
    });

    notifyPostMentionsSafely(authorId, String(post._id), content);

    return sanitizePost(post);
}

async function getPostsByAuthor(
    authorId: string,
    limit = 5,
    cursor?: string | null
): Promise<PostPageResponse> {
    return findPostPage({ authorId }, limit, cursor);
}

async function getPostsByAuthors(
    authorIds: string[],
    limit = 5,
    cursor?: string | null
): Promise<PostPageResponse> {
    const normalizedAuthorIds = Array.from(
        new Set(authorIds.map((authorId) => authorId.trim()).filter(Boolean))
    );

    if (normalizedAuthorIds.length === 0) {
        return {
            posts: [],
            nextCursor: null,
            hasMore: false,
        };
    }

    return findPostPage(
        { authorId: { $in: normalizedAuthorIds } },
        limit,
        cursor
    );
}

async function getPostById(postId: string): Promise<PostResponse> {
    const post = await Post.findById(postId);

    if (!post) {
        throw new Error("POST_NOT_FOUND");
    }

    return sanitizePost(post);
}

async function updatePost(
    postId: string,
    data: Partial<CreatePostInput>
): Promise<PostResponse> {
    const tags = data.content !== undefined
        ? mergeTagsWithHashtags(data.content, data.tags)
        : data.tags;
    const post = await Post.findByIdAndUpdate(
        postId,
        { content: data.content, tags, media: data.media },
        { returnDocument: "after", runValidators: true }
    );

    if (!post) {
        throw new Error("POST_NOT_FOUND");
    }

    return sanitizePost(post);
}

async function getAllPosts(
    limit = 5,
    cursor?: string | null
): Promise<PostPageResponse> {
    return findPostPage({}, limit, cursor);
}

async function getPostsByTag(
    tag: string,
    limit = 5,
    cursor?: string | null
): Promise<PostPageResponse> {
    const normalizedTag = tag.trim().toLowerCase().replace(/^#/, "");
    return findPostPage({ tags: normalizedTag }, limit, cursor);
}

async function softDeletePost(
    postId: string,
    requesterId?: string | null
): Promise<PostResponse> {
    const post = await Post.findById(postId);

    if (!post || post.deletedAt) {
        throw new Error("POST_NOT_FOUND");
    }

    if (requesterId && post.authorId !== requesterId) {
        throw new Error("POST_FORBIDDEN");
    }

    post.deletedAt = new Date();
    await post.save();

    return sanitizePost(post);
}

const postService = {
    createPost,
    getPostsByAuthor,
    getPostsByAuthors,
    getPostsByTag,
    getAllPosts,
    getPostById,
    updatePost,
    softDeletePost,
};

export default postService;