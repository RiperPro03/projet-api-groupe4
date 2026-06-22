import { Router } from "express";
import os from "os";
import mongoose from "mongoose";
import postValidator from "../middlewares/post.middleware";
import postController from "../controllers/post.controller";

const router = Router();

const serviceName = process.env.SERVICE_NAME || "post-service";

router.get("/health", (_req, res) => {
    res.json({
        service: serviceName,
        status: "OK",
        hostname: os.hostname(),
    });
});

router.get("/health/db", async (_req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            throw new Error("MongoDB not connected");
        }

        res.json({
            service: serviceName,
            database: "OK",
            status: "OK",
        });
    } catch (error) {
        res.status(500).json({
            service: serviceName,
            database: "ERROR",
            status: "KO",
            message: "Database connection failed",
        });
        console.error(error);
    }
});

router.post(
    "/",
    postValidator.requiredFields(["content", "authorId"]),
    postValidator.validateCreatePost,
    postController.createPost
);

router.get(
    "/",
    postController.getPostsByAuthor
);

router.get(
    "/all",
    postController.getAllPosts
);

router.get(
    "/feed",
    postController.getFeedPosts
);

router.get(
    "/tag/:tag",
    postController.getPostsByTag
);

router.get(
    "/:id",
    postController.getPostById
);

router.patch(
    "/:id",
    postValidator.validateCreatePost,
    postController.updatePost
);

router.delete(
    "/:id",
    postController.softDeletePost
);

export default router;