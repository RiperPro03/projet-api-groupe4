import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import os from "os";
import mongoose from "mongoose";
import mediaController from "../controllers/media.controller";

const router = Router();

const serviceName = process.env.SERVICE_NAME || "media-service";

// ──────────────────────────────────────────────
// Middlewares de validation
// ──────────────────────────────────────────────

// Types MIME autorisés
const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
    "application/pdf",
];

// Valide le body de POST /media/presigned-url
function validatePresignedUrl(req: Request, res: Response, next: NextFunction) {
    const { filename, mimeType, size, usage } = req.body;

    if (!filename || typeof filename !== "string") {
        return res.status(400).json({
            status: "error",
            message: "filename is required",
        });
    }

    if (!mimeType || !ALLOWED_MIME_TYPES.includes(mimeType)) {
        return res.status(400).json({
            status: "error",
            message: `mimeType must be one of: ${ALLOWED_MIME_TYPES.join(", ")}`,
        });
    }

    if (!size || typeof size !== "number" || size <= 0) {
        return res.status(400).json({
            status: "error",
            message: "size must be a positive number (in bytes)",
        });
    }

    // Limite selon le type de fichier.
    const isVideo = typeof mimeType === "string" && mimeType.startsWith("video/");
    const maxSize = isVideo ? 10000 * 1024 * 1024 : 100 * 1024 * 1024;
    const maxSizeLabel = isVideo ? "10GB" : "100MB";

    if (size > maxSize) {
        return res.status(400).json({
            status: "error",
            message: `File size cannot exceed ${maxSizeLabel}`,
        });
    }

    if (
        usage !== undefined &&
        !["profile", "post", "comment", "general"].includes(usage)
    ) {
        return res.status(400).json({
            status: "error",
            message: "usage must be one of: profile, post, comment, general",
        });
    }

    next();
}

// ──────────────────────────────────────────────
// Healthcheck
// ──────────────────────────────────────────────

router.get("/health", (_req, res) => {
    res.json({ service: serviceName, status: "OK", hostname: os.hostname() });
});

router.get("/health/db", async (_req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) throw new Error("MongoDB not connected");
        res.json({ service: serviceName, database: "OK", status: "OK" });
    } catch (error) {
        res.status(500).json({ service: serviceName, database: "ERROR", status: "KO" });
        console.error(error);
    }
});

// ──────────────────────────────────────────────
// Routes Media
// ──────────────────────────────────────────────

// POST /media/presigned-url — Génère une URL d'upload temporaire pour le front
router.post(
    "/presigned-url",
    validatePresignedUrl,
    mediaController.getPresignedUrl
);

// GET /media/:objectKey — Récupère les métadonnées d'un fichier
router.get("/:objectKey", mediaController.getMedia);

// DELETE /media/:objectKey — Supprime un fichier
router.delete("/:objectKey", mediaController.deleteMedia);

export default router;
