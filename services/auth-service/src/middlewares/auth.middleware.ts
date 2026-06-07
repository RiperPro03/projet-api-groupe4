import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/token.util";

export type AuthenticatedRequest = Request & {
    user?: {
        id: string;
        email: string;
        role: string;
    };
};

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
    next: NextFunction,
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

function validateLoginInput(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const { email, password } = req.body;

    if (typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({
            status: "error",
            message: "Email and password must be strings",
        });
    }

    next();
}

function authenticate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            status: "error",
            message: "Missing or invalid authorization header",
        });
    }

    const token = authorization.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            status: "error",
            message: "Missing token",
        });
    }

    try {
        const payload = verifyAccessToken(token);

        req.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        };

        next();
    } catch {
        return res.status(401).json({
            status: "error",
            message: "Invalid or expired token",
        });
    }
}

const authValidator = {
    requiredFields,
    validateRegisterInput,
    validateLoginInput,
    authenticate,
};

export default authValidator;