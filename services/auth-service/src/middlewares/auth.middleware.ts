import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/token.util";

export type AuthenticatedRequest = Request & {
    user?: {
        id: string;
        email: string;
    };
};

const MIN_PASSWORD_LENGTH = 8;

function validatePasswordMinLength(
    password: string,
    res: Response,
    fieldLabel: string,
): Response | undefined {
    if (password.length >= MIN_PASSWORD_LENGTH) {
        return;
    }

    return res.status(400).json({
        status: "error",
        message: `The ${fieldLabel} must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    });
}

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

    const passwordLengthError = validatePasswordMinLength(
        password,
        res,
        "password",
    );

    if (passwordLengthError) {
        return passwordLengthError;
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

function validatePasswordUpdateInput(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const { currentPassword, newPassword } = req.body;

    if (
        typeof currentPassword !== "string" ||
        typeof newPassword !== "string"
    ) {
        return res.status(400).json({
            status: "error",
            message: "Current password and new password must be strings",
        });
    }

    const newPasswordLengthError = validatePasswordMinLength(
        newPassword,
        res,
        "new password",
    );

    if (newPasswordLengthError) {
        return newPasswordLengthError;
    }

    if (newPassword === currentPassword) {
        return res.status(400).json({
            status: "error",
            message: "The new password must be different from the current password",
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
    validatePasswordUpdateInput,
    authenticate,
};

export default authValidator;
