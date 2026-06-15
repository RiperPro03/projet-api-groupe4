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
    const { content } = req.body;

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

    next();
}

const postValidator = {
    requiredFields,
    validateCreatePost,
};

export default postValidator;