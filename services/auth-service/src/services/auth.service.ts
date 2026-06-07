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
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

function buildAccessToken(user: { id: string; email: string; role: string }): string {
    return generateAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role,
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

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
        },
        select: {
            id: true,
            email: true,
            role: true,
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

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

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
            role: user.role,
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

const authService = {
    registerUser,
    loginUser,
    refreshAccessToken,
};

export default authService;
