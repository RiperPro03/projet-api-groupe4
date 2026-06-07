import type { NextFunction, Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import authValidator, {
    type AuthenticatedRequest,
} from "../../src/middlewares/auth.middleware";
import { generateAccessToken } from "../../src/utils/token.util";

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

describe("auth.middleware", () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it("requiredFields rejects a missing field with 400", () => {
        const middleware = authValidator.requiredFields(["email", "password"]);
        const req = {
            body: { email: "user@example.com" },
        } as Request;
        const res = createResponse();
        const next = vi.fn() as NextFunction;

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                status: "error",
                message: expect.stringContaining("password"),
            }),
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("validateRegisterInput rejects an invalid email with 400", () => {
        const req = {
            body: {
                email: "invalid-email",
                password: "password123",
            },
        } as Request;
        const res = createResponse();
        const next = vi.fn() as NextFunction;

        authValidator.validateRegisterInput(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                status: "error",
                message: "Invalid email format",
            }),
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("validateRegisterInput rejects a short password with 400", () => {
        const req = {
            body: {
                email: "user@example.com",
                password: "short",
            },
        } as Request;
        const res = createResponse();
        const next = vi.fn() as NextFunction;

        authValidator.validateRegisterInput(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                status: "error",
                message: "The password must be at least 8 characters long",
            }),
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("validateLoginInput accepts valid string credentials", () => {
        const req = {
            body: {
                email: "user@example.com",
                password: "password123",
            },
        } as Request;
        const res = createResponse();
        const next = vi.fn() as NextFunction;

        authValidator.validateLoginInput(req, res, next);

        expect(next).toHaveBeenCalledOnce();
        expect(res.status).not.toHaveBeenCalled();
    });

    it("authenticate rejects requests without an Authorization header with 401", () => {
        const req = {
            headers: {},
        } as AuthenticatedRequest;
        const res = createResponse();
        const next = vi.fn() as NextFunction;

        authValidator.authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                status: "error",
                message: "Missing or invalid authorization header",
            }),
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("authenticate rejects an invalid token with 401", () => {
        const req = {
            headers: {
                authorization: "Bearer invalid-token",
            },
        } as AuthenticatedRequest;
        const res = createResponse();
        const next = vi.fn() as NextFunction;

        authValidator.authenticate(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                status: "error",
                message: "Invalid or expired token",
            }),
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("authenticate accepts a valid token, sets req.user and calls next", () => {
        const token = generateAccessToken({
            sub: "user-123",
            email: "user@example.com",
            role: "user",
        });

        const req = {
            headers: {
                authorization: `Bearer ${token}`,
            },
        } as AuthenticatedRequest;
        const res = createResponse();
        const next = vi.fn() as NextFunction;

        authValidator.authenticate(req, res, next);

        expect(req.user).toEqual({
            id: "user-123",
            email: "user@example.com",
            role: "user",
        });
        expect(next).toHaveBeenCalledOnce();
        expect(res.status).not.toHaveBeenCalled();
    });
});
