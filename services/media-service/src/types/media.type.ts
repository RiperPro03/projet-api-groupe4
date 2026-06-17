// Input pour générer une presigned URL
export type PresignedUrlInput = {
    filename: string;   // nom original du fichier
    mimeType: string;   // image/jpeg, video/mp4, etc.
    size: number;       // taille en octets
    alt?: string;       // texte alternatif optionnel
};

// Ce que retourne la génération de presigned URL
export type PresignedUrlResponse = {
    uploadUrl: string;  // URL temporaire pour le PUT direct sur MinIO
    objectKey: string;  // clé à conserver pour référencer le fichier
    publicUrl: string;  // URL définitive d'accès au fichier
    expiresIn: number;  // durée de validité en secondes
};

// Métadonnées d'un media retournées par l'API
export type MediaResponse = {
    id: string;
    objectKey: string;
    mimeType: string;
    size: number;
    originalName: string;
    alt: string;
    type: string;
    bucket: string;
    url: string;
    createdAt: Date;
    updatedAt: Date;
};