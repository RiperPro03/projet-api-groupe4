import type { Request, Response, NextFunction } from "express";

// Middleware de validation des champs requis
// Même logique que requiredFields dans l'auth-service
// (vue dans le workshop étape 5 : le middleware protège la route en amont)
function requiredFields(fieldsRequired: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const missingFields: string[] = [];

        fieldsRequired.forEach((field) => {
            if (
                req.body[field] === undefined ||
                req.body[field] === null ||
                req.body[field] === ""
            ) {
                missingFields.push(field);
            }
        });

        if (missingFields.length > 0) {
            return res.status(400).json({
                status: "error",
                message: `The following fields are required: ${missingFields.join(", ")}`,
            });
        }

        next();
    };
}

// Middleware de validation spécifique à la création d'un post (Fx3)
function validateCreatePost(req: Request, res: Response, next: NextFunction) {
    const { content, media } = req.body;

    if (typeof content !== "string") {
        return res.status(400).json({
            status: "error",
            message: "content must be a string",
        });
    }

    if (content.trim().length === 0) {
        return res.status(400).json({
            status: "error",
            message: "content cannot be empty",
        });
    }

    // Validation de la contrainte Fx3 : 280 caractères max
    if (content.length > 280) {
        return res.status(400).json({
            status: "error",
            message: "content cannot exceed 280 characters",
        });
    }

    if (media !== undefined) {
        if (!Array.isArray(media)) {
            return res.status(400).json({
                status: "error",
                message: "media must be an array",
            });
        }

        const isValidMedia = media.every((item) => (
            item &&
            typeof item.id === "string" &&
            ["image", "video"].includes(item.type) &&
            typeof item.url === "string" &&
            (item.alt === undefined || typeof item.alt === "string")
        ));

        if (!isValidMedia) {
            return res.status(400).json({
                status: "error",
                message: "media items must include id, type and url",
            });
        }

        if (media.length > 4) {
            return res.status(400).json({
                status: "error",
                message: "media cannot exceed 4 items",
            });
        }
    }

    next();
}

const postValidator = {
    requiredFields,
    validateCreatePost,
};

export default postValidator;
