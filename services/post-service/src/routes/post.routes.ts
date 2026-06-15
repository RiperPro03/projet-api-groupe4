import { Router } from "express";
import os from "os";
import mongoose from "mongoose";
import postValidator from "../middlewares/post.middleware";
import postController from "../controllers/post.controller";

const router = Router();

const serviceName = process.env.SERVICE_NAME || "post-service";

// ──────────────────────────────────────────────
// Routes de healthcheck (même pattern que auth-service)
// ──────────────────────────────────────────────

router.get("/health", (_req, res) => {
    res.json({
        service: serviceName,
        status: "OK",
        hostname: os.hostname(),
    });
});

router.get("/health/db", async (_req, res) => {
    try {
        // Vérification de la connexion MongoDB
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

// ──────────────────────────────────────────────
// Routes Posts
//
// Pipeline middleware (workshop étape 5) :
//   authenticate  →  requiredFields  →  validateCreatePost  →  controller
// ──────────────────────────────────────────────

// POST /posts — Fx3 : Créer un post
router.post(
    "/",
    postValidator.requiredFields(["content", "authorId"]),
    postValidator.validateCreatePost,
    postController.createPost
);

// GET /posts — Fx4 / Fx11 : Lister les posts d'un utilisateur
router.get(
    "/",
    postController.getPostsByAuthor
);

// GET /posts/all — Récupérer tous les posts
router.get(
    "/all",
    postController.getAllPosts
);

// GET /posts/:id — Récupérer un post par son id
router.get(
    "/:id",
    postController.getPostById
);

// PATCH /posts/:id — Modifier un post
router.patch(
    "/:id",
    postValidator.validateCreatePost,
    postController.updatePost
);

// DELETE /posts/:id — Soft delete d'un post
router.delete(
    "/:id",
    postController.softDeletePost
);

export default router;