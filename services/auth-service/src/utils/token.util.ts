import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { Secret, SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

type JwtUserPayload = {
    sub: string;
    email: string;
};

const ACCESS_SECRET: Secret = env.jwt.accessSecret;
const REFRESH_SECRET: Secret = env.jwt.refreshSecret;

const ACCESS_EXPIRES_IN = (
    process.env.JWT_ACCESS_EXPIRES_IN || "15m"
) as SignOptions["expiresIn"];

export function generateAccessToken(payload: JwtUserPayload): string {
    return jwt.sign(payload, ACCESS_SECRET, {
        expiresIn: ACCESS_EXPIRES_IN,
    });
}

export function generateRefreshToken(): string {
    return crypto.randomBytes(64).toString("hex");
}

export function hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
}

export function getRefreshTokenExpirationDate(): Date {
    const days = Number(process.env.JWT_REFRESH_EXPIRES_IN_DAYS || 7);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    return expiresAt;
}

export function verifyAccessToken(token: string): JwtUserPayload {
    return jwt.verify(token, ACCESS_SECRET) as JwtUserPayload;
}