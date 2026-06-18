import { v4 as uuidv4 } from "uuid";
import {
    buildPublicObjectUrl,
    minioClient,
    publicMinioClient,
    toBrowserMinioUrl,
} from "../config/minio";
import { env } from "../config/env";
import { Media } from "../models/media.model";
import type {
    MediaUsage,
    PresignedUrlInput,
    PresignedUrlResponse,
    MediaResponse,
} from "../types/media.type";

const PRESIGNED_EXPIRY = 5 * 60; // 5 minutes en secondes
const usageFolders: Record<MediaUsage, string> = {
    profile: "profiles",
    post: "posts",
    comment: "comments",
    general: "general",
};

// Détermine le type (image/video/file) depuis le mimeType
function resolveType(mimeType: string): "image" | "video" | "file" {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    return "file";
}

// Transforme un document Mongoose en objet de réponse propre
function sanitizeMedia(media: InstanceType<typeof Media>): MediaResponse {
    return {
        id: String(media._id),
        objectKey: media.objectKey,
        mimeType: media.mimeType,
        size: media.size,
        originalName: media.originalName,
        ownerId: media.ownerId,
        usage: media.usage,
        alt: media.alt,
        type: media.type,
        bucket: media.bucket,
        url: media.url,
        createdAt: media.createdAt as Date,
        updatedAt: media.updatedAt as Date,
    };
}

// Génère une presigned URL pour que le front upload directement sur MinIO
// ET sauvegarde les métadonnées en MongoDB en même temps
async function generatePresignedUrl(
    data: PresignedUrlInput
): Promise<PresignedUrlResponse> {
    // Génère un nom de fichier unique pour éviter les collisions
    const rawExt = data.filename.split(".").pop() ?? "bin";
    const ext = rawExt.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "bin";
    const objectKey = `${usageFolders[data.usage]}/${data.ownerId}/${uuidv4()}.${ext}`;
    const bucket = env.minio.bucket;

    // Génère l'URL signée (valable PRESIGNED_EXPIRY secondes)
    const uploadUrl = await publicMinioClient.presignedPutObject(
        bucket,
        objectKey,
        PRESIGNED_EXPIRY
    );

    const publicUrl = buildPublicObjectUrl(bucket, objectKey);

    // Sauvegarde les métadonnées en MongoDB dès la génération
    // (le fichier n'est pas encore uploadé mais on connaît déjà ses infos)
    await Media.create({
        objectKey,
        mimeType: data.mimeType,
        size: data.size,
        originalName: data.filename,
        ownerId: data.ownerId,
        usage: data.usage,
        alt: data.alt ?? "",
        type: resolveType(data.mimeType),
        bucket,
        url: publicUrl,
    });

    return {
        uploadUrl: toBrowserMinioUrl(uploadUrl),
        objectKey,
        publicUrl,
        expiresIn: PRESIGNED_EXPIRY,
    };
}

// Récupère les métadonnées d'un fichier par son objectKey
async function getMediaByKey(objectKey: string): Promise<MediaResponse> {
    const media = await Media.findOne({ objectKey });

    if (!media) {
        throw new Error("MEDIA_NOT_FOUND");
    }

    return sanitizeMedia(media);
}

// Supprime un fichier de MinIO ET ses métadonnées de MongoDB
async function deleteMedia(objectKey: string, ownerId?: string): Promise<void> {
    const media = await Media.findOne({ objectKey });

    if (!media) {
        throw new Error("MEDIA_NOT_FOUND");
    }

    if (ownerId && media.ownerId !== ownerId) {
        throw new Error("MEDIA_FORBIDDEN");
    }

    // Supprime le fichier binaire dans MinIO
    await minioClient.removeObject(env.minio.bucket, objectKey);

    // Supprime les métadonnées dans MongoDB
    await Media.deleteOne({ objectKey });
}

const mediaService = {
    generatePresignedUrl,
    getMediaByKey,
    deleteMedia,
};

export default mediaService;
