import type { Request, Response } from "express";
import postService from "../services/post.service";

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


const postController = {
    createPost,
};

export default postController;