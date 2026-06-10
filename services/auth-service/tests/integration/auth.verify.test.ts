import { beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { generateAccessToken } from "../../src/utils/token.util";

vi.mock("../../src/config/prisma", () => ({
    prisma: {
        $queryRaw: vi.fn(),
        user: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
        refreshToken: {
            create: vi.fn(),
        },
    },
}));

let app: Express;

beforeAll(async () => {
    ({ default: app } = await import("../../src/app"));
});

describe("GET /auth/verify", () => {
    it("returns 401 without a token", async () => {
        const response = await request(app).get("/auth/verify");

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
            expect.objectContaining({
                status: "error",
            }),
        );
    });

    it("returns 401 with an invalid token", async () => {
        const response = await request(app)
            .get("/auth/verify")
            .set("Authorization", "Bearer invalid-token");

        expect(response.status).toBe(401);
        expect(response.body).toEqual(
            expect.objectContaining({
                status: "error",
            }),
        );
    });

    it('returns 200 with status "success" and message "Token is valid" for a valid token', async () => {
        const token = generateAccessToken({
            sub: "user-123",
            email: "user@example.com",
        });

        const response = await request(app)
            .get("/auth/verify")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual(
            expect.objectContaining({
                status: "success",
                message: "Token is valid",
            }),
        );
    });
});
