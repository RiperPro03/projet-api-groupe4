import type { Request, Response } from "express";
import authService from "../services/auth.service";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";

async function register(req: Request, res: Response) {
    try {
        const user = await authService.registerUser({
            email: req.body.email,
            password: req.body.password,
        });

        return res.status(201).json({
            status: "success",
            message: "User registered",
            data: {
                user,
            },
        });
    } catch (error) {
        console.log(error);

        if (error instanceof Error && error.message === "EMAIL_ALREADY_USED") {
            return res.status(409).json({
                status: "error",
                message: "This email is already used",
            });
        }

        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
}

async function login(req: Request, res: Response) {
    try {
        const result = await authService.loginUser({
            email: req.body.email,
            password: req.body.password,
        });

        return res.status(200).json({
            status: "success",
            message: "User logged in",
            data: {
                user: result.user,
                accessToken: result.tokens.accessToken,
                refreshToken: result.tokens.refreshToken,
            },
        });
    } catch (error) {
        console.log(error);

        if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
            return res.status(401).json({
                status: "error",
                message: "Invalid email or password",
            });
        }

        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
}

async function verify(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
        return res.status(401).json({
            status: "error",
            message: "Unauthorized",
        });
    }

    return res.status(200).json({
        status: "success",
        message: "Token is valid",
        data: {
            user: req.user,
        },
    });
}

const authController = {
    register,
    login,
    verify,
};

export default authController;