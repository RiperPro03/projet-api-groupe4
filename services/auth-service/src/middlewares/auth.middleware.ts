import type { Request, Response, NextFunction } from "express";

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

function validateRegisterInput(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({
            status: "error",
            message: "Email addresses and passwords must be strings of characters",
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({
            status: "error",
            message: "Invalid email format",
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            status: "error",
            message: "The password must be at least 8 characters long",
        });
    }

    next();
}

const authValidator = {
    requiredFields,
    validateRegisterInput,
};

export default authValidator;