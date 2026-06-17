import { Post } from "../models/post.model";
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
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
}): PostResponse {
    return {
        id: String(post._id),
        authorId: post.authorId,
        content: post.content,
        tags: post.tags ?? [],
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
    const post = await Post.create({
        authorId,
        content: data.content.trim(),
        tags: data.tags ?? [],
    });

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
    const post = await Post.findByIdAndUpdate(
        postId,
        { content: data.content, tags: data.tags },
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

async function softDeletePost(postId: string): Promise<PostResponse> {
    const post = await Post.findByIdAndUpdate(
        postId,
        { deletedAt: new Date() },
        { returnDocument: "after" }
    );

    if (!post) {
        throw new Error("POST_NOT_FOUND");
    }

    return sanitizePost(post);
}

const postService = {
    createPost,
    getPostsByAuthor,
    getPostsByAuthors,
    getAllPosts,
    getPostById,
    updatePost,
    softDeletePost,
};

export default postService;
