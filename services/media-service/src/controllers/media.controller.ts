import type { Request, Response } from "express";
import mediaService from "../services/media.service";
import type { MediaUsage } from "../types/media.type";

const mediaUsages: MediaUsage[] = ["profile", "post", "comment", "general"];

function getAuthenticatedOwnerId(req: Request): string | null {
    const ownerId = req.header("x-user-id");

    return ownerId && ownerId.trim().length > 0 ? ownerId.trim() : null;
}

function resolveMediaUsage(value: unknown): MediaUsage {
    return typeof value === "string" && mediaUsages.includes(value as MediaUsage)
        ? value as MediaUsage
        : "general";
}

// POST /media/presigned-url — Génère une URL d'upload temporaire
async function getPresignedUrl(req: Request, res: Response) {
    try {
        const ownerId = getAuthenticatedOwnerId(req);

        if (!ownerId) {
            return res.status(401).json({
                status: "error",
                message: "Missing authenticated user",
            });
        }

        const { filename, mimeType, size, alt, usage } = req.body;

        const result = await mediaService.generatePresignedUrl({
            filename,
            mimeType,
            size,
            alt,
            ownerId,
            usage: resolveMediaUsage(usage),
        });

        return res.status(201).json({
            status: "success",
            message: "Presigned URL generated",
            data: result,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
}

// GET /media/:objectKey — Récupère les métadonnées d'un fichier
async function getMedia(req: Request<{ objectKey: string }>, res: Response) {
    try {
        const media = await mediaService.getMediaByKey(req.params.objectKey);

        return res.status(200).json({
            status: "success",
            message: "Media retrieved",
            data: { media },
        });
    } catch (error) {
        if (error instanceof Error && error.message === "MEDIA_NOT_FOUND") {
            return res.status(404).json({
                status: "error",
                message: "Media not found",
            });
        }
        console.error(error);
        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
}

// DELETE /media/:objectKey — Supprime un fichier (MinIO + MongoDB)
async function deleteMedia(req: Request<{ objectKey: string }>, res: Response) {
    try {
        const ownerId = getAuthenticatedOwnerId(req);

        if (!ownerId) {
            return res.status(401).json({
                status: "error",
                message: "Missing authenticated user",
            });
        }

        await mediaService.deleteMedia(req.params.objectKey, ownerId);

        return res.status(200).json({
            status: "success",
            message: "Media deleted",
        });
    } catch (error) {
        if (error instanceof Error && error.message === "MEDIA_NOT_FOUND") {
            return res.status(404).json({
                status: "error",
                message: "Media not found",
            });
        }
        if (error instanceof Error && error.message === "MEDIA_FORBIDDEN") {
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

const mediaController = {
    getPresignedUrl,
    getMedia,
    deleteMedia,
};

export default mediaController;
