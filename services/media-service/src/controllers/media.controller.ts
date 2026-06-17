import type { Request, Response } from "express";
import mediaService from "../services/media.service";

// POST /media/presigned-url — Génère une URL d'upload temporaire
async function getPresignedUrl(req: Request, res: Response) {
    try {
        const { filename, mimeType, size, alt } = req.body;

        const result = await mediaService.generatePresignedUrl({
            filename,
            mimeType,
            size,
            alt,
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
async function getMedia(req: Request, res: Response) {
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
async function deleteMedia(req: Request, res: Response) {
    try {
        await mediaService.deleteMedia(req.params.objectKey);

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