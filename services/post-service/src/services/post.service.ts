import { Post } from "../models/post.model";
import type { CreatePostInput, PostResponse } from "../models/post.types";

// Couche service : contient la logique métier
// Le controller appelle le service, le service parle à Mongoose
// Même architecture que auth.service.ts dans l'auth-service

// Transforme un document Mongoose en objet de réponse propre
function sanitizePost(post: InstanceType<typeof Post>): PostResponse {
    return {
        id: String(post._id),
        authorId: post.authorId,
        content: post.content,
        tags: post.tags,
        createdAt: post.createdAt as Date,
        updatedAt: post.updatedAt as Date,
    };
}

// Fx3 : Créer un post
// authorId vient du token JWT (req.user.id), pas du body client
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

// Fx4 / Fx11 : Récupérer les posts d'un utilisateur, triés par date décroissante
async function getPostsByAuthor(authorId: string): Promise<PostResponse[]> {
    const posts = await Post.find({ authorId })
        .sort({ createdAt: -1 }) // Plus récents en premier
        .lean();                 // .lean() = objet JS simple, plus rapide

    return posts.map((post) => ({
        id: String(post._id),
        authorId: post.authorId,
        content: post.content,
        tags: post.tags,
        createdAt: post.createdAt as Date,
        updatedAt: post.updatedAt as Date,
    }));
}

const postService = {
    createPost,
    getPostsByAuthor,
};

export default postService;