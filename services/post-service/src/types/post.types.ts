// Types TypeScript pour le post-service
// Même pattern que auth.model.ts dans l'auth-service

// Input reçu du client pour créer un post
export type CreatePostInput = {
    content: string;
    tags?: string[];
};

// Ce qu'on retourne dans les réponses API (sans les champs Mongoose internes)
export type PostResponse = {
    id: string;
    authorId: string;
    content: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
};

export type PostPageResponse = {
    posts: PostResponse[];
    nextCursor: string | null;
    hasMore: boolean;
};
