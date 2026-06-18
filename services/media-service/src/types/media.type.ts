export type MediaUsage = "profile" | "post" | "comment" | "general";

// Input pour générer une presigned URL
export type PresignedUrlInput = {
    filename: string;
    mimeType: string;
    size: number;
    alt?: string;
    ownerId: string;
    usage: MediaUsage;
};

// Ce que retourne la génération de presigned URL
export type PresignedUrlResponse = {
    uploadUrl: string; // URL temporaire pour le PUT direct sur MinIO
    objectKey: string; // clé à conserver pour référencer le fichier
    publicUrl: string; // URL définitive d'accès au fichier
    expiresIn: number; // durée de validité en secondes
};

// Métadonnées d'un media retournées par l'API
export type MediaResponse = {
    id: string;
    objectKey: string;
    mimeType: string;
    size: number;
    originalName: string;
    ownerId: string;
    usage: MediaUsage;
    alt: string;
    type: string;
    bucket: string;
    url: string;
    createdAt: Date;
    updatedAt: Date;
};
