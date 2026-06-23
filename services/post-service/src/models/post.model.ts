import { Schema, model, Document } from "mongoose";

// Interface TypeScript décrivant la forme d'un document Post
// (même approche que les types dans auth.model.ts de l'auth-service)
export interface IPost extends Document {
    authorId: string;       // ID de l'utilisateur venant du JWT (pas de FK Mongo)
    content: string;        // Texte du post, max 280 caractères — Fx3
    tags: string[];         // Tags associés — prévu pour Fx12
    media: {
        id: string;
        type: "image" | "video";
        url: string;
        alt?: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null; // Pour le soft-delete
}

// Schéma Mongoose — même logique que le workshop todo-api étape 4
const postSchema = new Schema<IPost>(
    {
        authorId: {
            type: String,
            required: true,
            index: true,        // Index pour accélérer GET /posts?authorId=...
        },
        content: {
            type: String,
            required: true,
            maxlength: 280,     // Contrainte Fx3 : 280 caractères max
            trim: true,
        },
        tags: {
            type: [String],
            default: [],
        },
        media: {
            type: [
                {
                    id: {
                        type: String,
                        required: true,
                    },
                    type: {
                        type: String,
                        enum: ["image", "video"],
                        required: true,
                    },
                    url: {
                        type: String,
                        required: true,
                    },
                    alt: {
                        type: String,
                        default: "",
                    },
                },
            ],
            default: [],
        },
        deletedAt: {
            type: Date,
            default: null,
        }
    },
    {
        // timestamps: true génère automatiquement createdAt et updatedAt
        timestamps: true,
    }
);

// Index composé : récupérer les posts d'un auteur triés par date décroissante (Fx4 / Fx11)
postSchema.index({ authorId: 1, createdAt: -1 });

export const Post = model<IPost>("Post", postSchema);
