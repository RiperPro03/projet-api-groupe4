import { Schema, model, Document } from "mongoose";
import type { MediaUsage } from "../types/media.type";

export interface IMedia extends Document {
    objectKey: string;
    mimeType: string;
    size: number;
    originalName: string;
    ownerId: string;
    usage: MediaUsage;
    alt: string;
    type: "image" | "video" | "file";
    bucket: string;
    url: string;
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
        ownerId: {
            type: String,
            required: true,
            index: true,
        },
        usage: {
            type: String,
            enum: ["profile", "post", "comment", "general"],
            required: true,
            index: true,
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
    { timestamps: true },
);

export const Media = model<IMedia>("Media", mediaSchema);
