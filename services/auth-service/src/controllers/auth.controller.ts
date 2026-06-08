import type { Request, Response } from "express";
import authService from "../services/auth.service";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import type * as AuthModel from "../models/auth.model";

async function register(req: Request, res: Response) {
    try {
        const user = await authService.registerUser({
            email: req.body.email,
            passwordHash: req.body.password,
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
            passwordHash: req.body.password,
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

async function refreshToken(req: Request, res: Response) {
    try {
        const payload = req.body as AuthModel.RefreshTokenInput;
        const tokens = await authService.refreshAccessToken(payload);

        return res.status(200).json({
            status: "success",
            message: "Token refreshed",
            data: {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            },
        });
    } catch (error) {
        console.log(error);

        if (
            error instanceof Error &&
            error.message === "REFRESH_TOKEN_REQUIRED"
        ) {
            return res.status(400).json({
                status: "error",
                message: "Refresh token is required",
            });
        }

        if (
            error instanceof Error &&
            error.message === "INVALID_REFRESH_TOKEN"
        ) {
            return res.status(401).json({
                status: "error",
                message: "Invalid refresh token",
            });
        }

        if (
            error instanceof Error &&
            error.message === "REFRESH_TOKEN_EXPIRED"
        ) {
            return res.status(401).json({
                status: "error",
                message: "Refresh token expired",
            });
        }

        if (
            error instanceof Error &&
            error.message === "REFRESH_TOKEN_REVOKED"
        ) {
            return res.status(401).json({
                status: "error",
                message: "Refresh token revoked",
            });
        }

        if (error instanceof Error && error.message === "USER_NOT_FOUND") {
            return res.status(404).json({
                status: "error",
                message: "User not found",
            });
        }

        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
}

async function logout(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
        return res.status(401).json({
            status: "error",
            message: "Unauthorized",
        });
    }

    try {
        await authService.logoutUser(req.user.id, req.body.refreshToken);

        return res.status(200).json({
            status: "success",
            message: "User logged out",
        });
    } catch (error) {
        console.log(error);

        if (
            error instanceof Error &&
            error.message === "REFRESH_TOKEN_REQUIRED"
        ) {
            return res.status(400).json({
                status: "error",
                message: "Refresh token is required",
            });
        }

        if (
            error instanceof Error &&
            error.message === "INVALID_REFRESH_TOKEN"
        ) {
            return res.status(401).json({
                status: "error",
                message: "Invalid refresh token",
            });
        }

        if (
            error instanceof Error &&
            error.message === "REFRESH_TOKEN_ALREADY_REVOKED"
        ) {
            return res.status(401).json({
                status: "error",
                message: "Refresh token already revoked",
            });
        }

        if (
            error instanceof Error &&
            error.message === "REFRESH_TOKEN_USER_MISMATCH"
        ) {
            return res.status(403).json({
                status: "error",
                message: "Refresh token does not belong to the authenticated user",
            });
        }

        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
}

async function updatePassword(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
        return res.status(401).json({
            status: "error",
            message: "Unauthorized",
        });
    }

    try {
        await authService.updatePassword(
            req.user.id,
            req.body.currentPassword,
            req.body.newPassword,
        );

        return res.status(200).json({
            status: "success",
            message: "Password updated successfully",
        });
    } catch (error) {
        console.log(error);

        if (
            error instanceof Error &&
            error.message === "INVALID_CURRENT_PASSWORD"
        ) {
            return res.status(401).json({
                status: "error",
                message: "Invalid current password",
            });
        }

        if (error instanceof Error && error.message === "USER_NOT_FOUND") {
            return res.status(404).json({
                status: "error",
                message: "User not found",
            });
        }

        return res.status(500).json({
            status: "error",
            message: "Internal server error",
        });
    }
}

const authController = {
    register,
    login,
    verify,
    refreshToken,
    logout,
    updatePassword,
};

export default authController;
