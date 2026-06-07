import type { Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import authController from "../../src/controllers/auth.controller";
import type { AuthenticatedRequest } from "../../src/middlewares/auth.middleware";
import authService from "../../src/services/auth.service";

vi.mock("../../src/services/auth.service", () => ({
    default: {
        registerUser: vi.fn(),
        loginUser: vi.fn(),
        refreshAccessToken: vi.fn(),
        logoutUser: vi.fn(),
    },
}));

type MockResponse = Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
};

function createResponse(): MockResponse {
    const response = {} as MockResponse;

    response.status = vi.fn((statusCode: number) => {
        response.statusCode = statusCode;
        return response;
    }) as MockResponse["status"];

    response.json = vi.fn((body: unknown) => {
        response.locals.body = body;
        return response;
    }) as MockResponse["json"];

    response.locals = {};

    return response;
}

const mockedAuthService = vi.mocked(authService, true);

describe("auth.controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, "log").mockImplementation(() => undefined);
    });

    describe("logout", () => {
        it("returns 401 when req.user is missing", async () => {
            const req = {
                body: {
                    refreshToken: "refresh-token",
                },
            } as AuthenticatedRequest;
            const res = createResponse();

            await authController.logout(req, res);

            expect(mockedAuthService.logoutUser).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                status: "error",
                message: "Unauthorized",
            });
        });

        it("returns 200 and delegates logout to the service", async () => {
            const req = {
                user: {
                    id: "user-1",
                    email: "user@example.com",
                    role: "USER",
                },
                body: {
                    refreshToken: "refresh-token",
                },
            } as AuthenticatedRequest;
            const res = createResponse();

            mockedAuthService.logoutUser.mockResolvedValue(undefined);

            await authController.logout(req, res);

            expect(mockedAuthService.logoutUser).toHaveBeenCalledWith(
                "user-1",
                "refresh-token",
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                status: "success",
                message: "User logged out",
            });
        });

        it("returns 400 when the refresh token is missing", async () => {
            const req = {
                user: {
                    id: "user-1",
                    email: "user@example.com",
                    role: "USER",
                },
                body: {},
            } as AuthenticatedRequest;
            const res = createResponse();

            mockedAuthService.logoutUser.mockRejectedValue(
                new Error("REFRESH_TOKEN_REQUIRED"),
            );

            await authController.logout(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                status: "error",
                message: "Refresh token is required",
            });
        });

        it("returns 401 when the refresh token is invalid", async () => {
            const req = {
                user: {
                    id: "user-1",
                    email: "user@example.com",
                    role: "USER",
                },
                body: {
                    refreshToken: "invalid-refresh-token",
                },
            } as AuthenticatedRequest;
            const res = createResponse();

            mockedAuthService.logoutUser.mockRejectedValue(
                new Error("INVALID_REFRESH_TOKEN"),
            );

            await authController.logout(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                status: "error",
                message: "Invalid refresh token",
            });
        });

        it("returns 401 when the refresh token is already revoked", async () => {
            const req = {
                user: {
                    id: "user-1",
                    email: "user@example.com",
                    role: "USER",
                },
                body: {
                    refreshToken: "revoked-refresh-token",
                },
            } as AuthenticatedRequest;
            const res = createResponse();

            mockedAuthService.logoutUser.mockRejectedValue(
                new Error("REFRESH_TOKEN_ALREADY_REVOKED"),
            );

            await authController.logout(req, res);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                status: "error",
                message: "Refresh token already revoked",
            });
        });

        it("returns 403 when the refresh token belongs to another user", async () => {
            const req = {
                user: {
                    id: "user-1",
                    email: "user@example.com",
                    role: "USER",
                },
                body: {
                    refreshToken: "other-user-refresh-token",
                },
            } as AuthenticatedRequest;
            const res = createResponse();

            mockedAuthService.logoutUser.mockRejectedValue(
                new Error("REFRESH_TOKEN_USER_MISMATCH"),
            );

            await authController.logout(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                status: "error",
                message: "Refresh token does not belong to the authenticated user",
            });
        });

        it("returns 500 on unexpected errors", async () => {
            const req = {
                user: {
                    id: "user-1",
                    email: "user@example.com",
                    role: "USER",
                },
                body: {
                    refreshToken: "refresh-token",
                },
            } as AuthenticatedRequest;
            const res = createResponse();

            mockedAuthService.logoutUser.mockRejectedValue(
                new Error("DATABASE_DOWN"),
            );

            await authController.logout(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                status: "error",
                message: "Internal server error",
            });
        });
    });
});
