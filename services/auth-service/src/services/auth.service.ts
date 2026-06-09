import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import type * as AuthModel from "../models/auth.model";

import {
    generateAccessToken,
    generateRefreshToken,
    getRefreshTokenExpirationDate,
    hashToken,
} from "../utils/token.util";

const SALT_ROUNDS = 10;

function sanitizeUser(user: AuthModel.SafeUser): AuthModel.SafeUser {
    return {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

function buildAccessToken(user: { id: string; email: string }): string {
    return generateAccessToken({
        sub: user.id,
        email: user.email,
    });
}

async function storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await prisma.refreshToken.create({
        data: {
            tokenHash: hashToken(refreshToken),
            userId,
            expiresAt: getRefreshTokenExpirationDate(),
        },
    });
}

async function registerUser(data: AuthModel.RegisterInput): Promise<AuthModel.SafeUser> {
    const email = data.email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new Error("EMAIL_ALREADY_USED");
    }

    const hashedPassword = await bcrypt.hash(data.passwordHash, SALT_ROUNDS);

    const user = await prisma.user.create({
        data: {
            email,
            passwordHash: hashedPassword,
        },
        select: {
            id: true,
            email: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return sanitizeUser(user);
}

async function loginUser(data: AuthModel.LoginInput): Promise<AuthModel.AuthResponse> {
    const email = data.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const isPasswordValid = await bcrypt.compare(data.passwordHash, user.passwordHash);

    if (!isPasswordValid) {
        throw new Error("INVALID_CREDENTIALS");
    }

    const accessToken = buildAccessToken(user);
    const refreshToken = generateRefreshToken();
    await storeRefreshToken(user.id, refreshToken);

    return {
        user: sanitizeUser({
            id: user.id,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        }),
        tokens: {
            accessToken,
            refreshToken,
        },
    };
}

async function refreshAccessToken(
    data: AuthModel.RefreshTokenInput,
): Promise<AuthModel.RefreshTokenResponse> {
    const { refreshToken } = data;

    if (typeof refreshToken !== "string" || refreshToken.trim() === "") {
        throw new Error("REFRESH_TOKEN_REQUIRED");
    }

    const currentTokenHash = hashToken(refreshToken);
    const storedRefreshToken = await prisma.refreshToken.findUnique({
        where: {
            tokenHash: currentTokenHash,
        },
    });

    if (!storedRefreshToken) {
        throw new Error("INVALID_REFRESH_TOKEN");
    }

    if (storedRefreshToken.revokedAt) {
        throw new Error("REFRESH_TOKEN_REVOKED");
    }

    if (storedRefreshToken.expiresAt.getTime() <= Date.now()) {
        throw new Error("REFRESH_TOKEN_EXPIRED");
    }

    const user = await prisma.user.findUnique({
        where: {
            id: storedRefreshToken.userId,
        },
    });

    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }

    const nextAccessToken = buildAccessToken(user);
    const nextRefreshToken = generateRefreshToken();
    const nextRefreshTokenHash = hashToken(nextRefreshToken);
    const revokedAt = new Date();

    await prisma.$transaction([
        prisma.refreshToken.update({
            where: {
                id: storedRefreshToken.id,
            },
            data: {
                revokedAt,
            },
        }),
        prisma.refreshToken.create({
            data: {
                tokenHash: nextRefreshTokenHash,
                userId: user.id,
                expiresAt: getRefreshTokenExpirationDate(),
            },
        }),
    ]);

    return {
        accessToken: nextAccessToken,
        refreshToken: nextRefreshToken,
    };
}

async function logoutUser(userId: string, refreshToken: string): Promise<void> {
    if (typeof refreshToken !== "string" || refreshToken.trim() === "") {
        throw new Error("REFRESH_TOKEN_REQUIRED");
    }

    const currentTokenHash = hashToken(refreshToken);
    const storedRefreshToken = await prisma.refreshToken.findUnique({
        where: {
            tokenHash: currentTokenHash,
        },
    });

    if (!storedRefreshToken) {
        throw new Error("INVALID_REFRESH_TOKEN");
    }

    if (storedRefreshToken.userId !== userId) {
        throw new Error("REFRESH_TOKEN_USER_MISMATCH");
    }

    if (storedRefreshToken.revokedAt) {
        throw new Error("REFRESH_TOKEN_ALREADY_REVOKED");
    }

    await prisma.refreshToken.update({
        where: {
            id: storedRefreshToken.id,
        },
        data: {
            revokedAt: new Date(),
        },
    });
}

async function updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
): Promise<void> {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
    });

    if (!user) {
        throw new Error("USER_NOT_FOUND");
    }

    const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
        throw new Error("INVALID_CURRENT_PASSWORD");
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            passwordHash: hashedNewPassword,
        },
    });

    await prisma.refreshToken.updateMany({
        where: {
            userId,
            revokedAt: null,
        },
        data: {
            revokedAt: new Date(),
        },
    });
}

const authService = {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    updatePassword,
};

export default authService;
