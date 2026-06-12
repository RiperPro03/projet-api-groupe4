import type { Request, Response } from "express";
import postService from "../services/post.service";

const getRouteParam = (value: string | string[] | undefined): string | undefined =>
    Array.isArray(value) ? value[0] : value;

// POST /posts — Fx3 : Créer un post
async function createPost(req: Request, res: Response) {
    try {
        const post = await postService.createPost(req.body.authorId, {
            content: req.body.content,
            tags: req.body.tags,
        });

        return res.status(201).json({
            status: "success",
            message: "Post created",
            data: { post },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
}

// GET /posts?authorId=xxx — Fx4 / Fx11 : Lister les posts d'un utilisateur
async function getPostsByAuthor(req: Request, res: Response) {
    try {
        const authorId = req.query.authorId as string;
 
        if (!authorId) {
            return res.status(400).json({
                status: "error",
                message: "authorId query param is required",
            });
        }
 
        const posts = await postService.getPostsByAuthor(authorId);
 
        return res.status(200).json({
            status: "success",
            message: "Posts retrieved",
            data: { posts },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
}
 
// GET /posts/:id — Récupérer un post par son id
async function getPostById(req: Request, res: Response) {
    try {
        const postId = getRouteParam(req.params.id);

        if (!postId) {
            return res.status(400).json({
                status: "error",
                message: "Post id is required",
            });
        }

        const post = await postService.getPostById(postId);
 
        return res.status(200).json({
            status: "success",
            message: "Post retrieved",
            data: { post },
        });
    } catch (error) {
        if (error instanceof Error && error.message === "POST_NOT_FOUND") {
            return res.status(404).json({
                status: "error",
                message: "Post not found",
            });
        }
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
}
 
// PATCH /posts/:id — Modifier un post
async function updatePost(req: Request, res: Response) {
    try {
        const postId = getRouteParam(req.params.id);

        if (!postId) {
            return res.status(400).json({
                status: "error",
                message: "Post id is required",
            });
        }

        const post = await postService.updatePost(postId, {
            content: req.body.content,
            tags: req.body.tags,
        });
 
        return res.status(200).json({
            status: "success",
            message: "Post updated",
            data: { post },
        });
    } catch (error) {
        if (error instanceof Error && error.message === "POST_NOT_FOUND") {
            return res.status(404).json({
                status: "error",
                message: "Post not found",
            });
        }
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
}

const postController = {
    createPost,
    getPostsByAuthor,
    getPostById,
    updatePost, 
};

export default postController;
