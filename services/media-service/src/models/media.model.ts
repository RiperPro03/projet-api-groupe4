import { Schema, model, Document } from "mongoose";

// Correspond à la table media du MCD
export interface IMedia extends Document {
    objectKey: string;      // clé unique dans MinIO (ex: uuid.jpg)
    mimeType: string;       // image/jpeg, video/mp4, etc.
    size: number;           // taille en octets
    originalName: string;   // nom original du fichier
    alt: string;            // texte alternatif (accessibilité)
    type: string;           // "image" | "video" | "file"
    bucket: string;         // nom du bucket MinIO
    url: string;            // URL publique d'accès au fichier
    createdAt: Date;
    updatedAt: Date;
}

const mediaSchema = new Schema<IMedia>(
    {
        objectKey: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        mimeType: {
            type: String,
            required: true,
        },
        size: {
            type: Number,
            required: true,
        },
        originalName: {
            type: String,
            required: true,
        },
        alt: {
            type: String,
            default: "",
        },
        type: {
            type: String,
            enum: ["image", "video", "file"],
            required: true,
        },
        bucket: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

export const Media = model<IMedia>("Media", mediaSchema);