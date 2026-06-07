import bcrypt from "bcrypt";
import { prisma } from "../config/prisma";
import type {
    AuthResponse,
    LoginInput,
    RegisterInput,
    SafeUser,
} from "../models/user.model";

import {
    generateAccessToken,
    generateRefreshToken,
    getRefreshTokenExpirationDate,
    hashToken,
} from "../utils/token.util";

const SALT_ROUNDS = 10;

function sanitizeUser(user: SafeUser): SafeUser {
    return {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

async function registerUser(data: RegisterInput): Promise<SafeUser> {
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

async function loginUser(data: LoginInput): Promise<AuthResponse> {
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

    const accessToken = generateAccessToken({
        sub: user.id,
        email: user.email,
        role: user.role,
    });

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);

    await prisma.refreshToken.create({
        data: {
            tokenHash: refreshTokenHash,
            userId: user.id,
            expiresAt: getRefreshTokenExpirationDate(),
        },
    });

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

const authService = {
    registerUser,
    loginUser,
};

export default authService;