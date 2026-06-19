import type { Request, Response } from "express";
import postService from "../services/post.service";

function getRouteParam(req: Request, name: string) {
    const value = req.params[name];

    return Array.isArray(value) ? value[0] : value;
}

function getPaginationParams(req: Request) {
    const parsedLimit = Number.parseInt(String(req.query.limit ?? "5"), 10);

    return {
        limit: Number.isNaN(parsedLimit) ? 5 : parsedLimit,
        cursor:
            typeof req.query.cursor === "string" && req.query.cursor.trim()
                ? req.query.cursor
                : null,
    };
}

function getAuthorIds(req: Request) {
    const value = req.query.authorIds;

    if (Array.isArray(value)) {
        return value.flatMap((item) => String(item).split(","));
    }

    if (typeof value === "string") {
        return value.split(",");
    }

    return [];
}

// POST /posts — Fx3 : Créer un post
async function createPost(req: Request, res: Response) {
    try {
        const post = await postService.createPost(req.body.authorId, {
            content: req.body.content,
            tags: req.body.tags,
            media: req.body.media,
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

        const { limit, cursor } = getPaginationParams(req);
        const page = await postService.getPostsByAuthor(authorId, limit, cursor);

        return res.status(200).json({
            status: "success",
            message: "Posts retrieved",
            data: page,
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
async function getFeedPosts(req: Request, res: Response) {
    try {
        const authorIds = getAuthorIds(req);

        if (authorIds.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "authorIds query param is required",
            });
        }

        const { limit, cursor } = getPaginationParams(req);
        const page = await postService.getPostsByAuthors(authorIds, limit, cursor);

        return res.status(200).json({
            status: "success",
            message: "Feed posts retrieved",
            data: page,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
}

async function getPostById(req: Request, res: Response) {
    try {
        const postId = getRouteParam(req, "id");

        if (!postId) {
            return res.status(400).json({
                status: "error",
                message: "id param is required",
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
        const postId = getRouteParam(req, "id");

        if (!postId) {
            return res.status(400).json({
                status: "error",
                message: "id param is required",
            });
        }

        const post = await postService.updatePost(postId, {
            content: req.body.content,
            tags: req.body.tags,
            media: req.body.media,
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

// GET /posts/all — Récupérer tous les posts
async function getAllPosts(req: Request, res: Response) {
    try {
        const { limit, cursor } = getPaginationParams(req);
        const page = await postService.getAllPosts(limit, cursor);

        return res.status(200).json({
            status: "success",
            message: "Posts retrieved",
            data: page,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
}

// DELETE /posts/:id — Soft delete d'un post
async function softDeletePost(req: Request, res: Response) {
    try {
        const postId = getRouteParam(req, "id");

        if (!postId) {
            return res.status(400).json({
                status: "error",
                message: "id param is required",
            });
        }

        const requesterId = req.header("x-user-id");
        const post = await postService.softDeletePost(postId, requesterId);

        return res.status(200).json({
            status: "success",
            message: "Post deleted",
            data: { post },
        });
    } catch (error) {
        if (error instanceof Error && error.message === "POST_NOT_FOUND") {
            return res.status(404).json({
                status: "error",
                message: "Post not found",
            });
        }
        if (error instanceof Error && error.message === "POST_FORBIDDEN") {
            return res.status(403).json({
                status: "error",
                message: "Forbidden",
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
    getFeedPosts,
    getPostById,
    getAllPosts,
    updatePost,
    softDeletePost,
};

export default postController;
