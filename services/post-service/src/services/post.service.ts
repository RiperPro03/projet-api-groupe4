import { Post } from "../models/post.model";
import type { CreatePostInput, PostResponse } from "../models/post.types";

// Couche service : contient la logique métier
// Le controller appelle le service, le service parle à Mongoose

// Transforme un document Mongoose en objet de réponse propre
function sanitizePost(post: InstanceType<typeof Post>): PostResponse {
    return {
        id: String(post._id),
        authorId: post.authorId,
        content: post.content,
        createdAt: post.createdAt as Date,
        updatedAt: post.updatedAt as Date,
        deletedAt: post.deletedAt,
    };
}

// Fx3 : Créer un post
async function createPost(
    authorId: string,
    data: CreatePostInput
): Promise<PostResponse> {
    const post = await Post.create({
        authorId,
        content: data.content.trim(),
    });

    return sanitizePost(post);
}

// Fx4 / Fx11 : Récupérer les posts d'un utilisateur, triés par date décroissante
// On exclut les posts soft-deleted (deletedAt != null)
async function getPostsByAuthor(authorId: string): Promise<PostResponse[]> {
    const posts = await Post.find({ authorId, deletedAt: null })
        .sort({ createdAt: -1 }) // Plus récents en premier
        .lean();                 // .lean() = objet JS simple, plus rapide

    return posts.map((post) => ({
        id: String(post._id),
        authorId: post.authorId,
        content: post.content,
        createdAt: post.createdAt as Date,
        updatedAt: post.updatedAt as Date,
        deletedAt: post.deletedAt,
    }));
}

// Récupérer un post par son id (un post soft-deleted reste consultable par id)
async function getPostById(postId: string): Promise<PostResponse> {
    const post = await Post.findById(postId);

    if (!post) {
        throw new Error("POST_NOT_FOUND");
    }

    return sanitizePost(post);
}

// Modifier un post par son id
async function updatePost(
    postId: string,
    data: Partial<CreatePostInput>
): Promise<PostResponse> {
    const post = await Post.findByIdAndUpdate(
        postId,
        { content: data.content },
        { returnDocument: "after", runValidators: true }
    );

    if (!post) {
        throw new Error("POST_NOT_FOUND");
    }

    return sanitizePost(post);
}

// Récupérer tous les posts (non supprimés), triés par date décroissante
async function getAllPosts(): Promise<PostResponse[]> {
    const posts = await Post.find({ deletedAt: null })
        .sort({ createdAt: -1 })
        .lean();

    return posts.map((post) => ({
        id: String(post._id),
        authorId: post.authorId,
        content: post.content,
        createdAt: post.createdAt as Date,
        updatedAt: post.updatedAt as Date,
        deletedAt: post.deletedAt,
    }));
}

// Soft delete : on ne supprime pas le document, on set deletedAt
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
    getAllPosts,
    getPostById,
    updatePost,
    softDeletePost,
};

export default postService;