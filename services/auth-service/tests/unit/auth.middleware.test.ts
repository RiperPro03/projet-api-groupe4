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

    // On reproduit le chainage Express classique : res.status(...).json(...)
    response.status = vi.fn((statusCode: number) => {
        response.statusCode = statusCode;
        return response;
    }) as MockResponse["status"];

    // On garde le JSON envoye pour pouvoir l'asserter facilement dans les tests.
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

        // Le middleware doit bloquer avant d'arriver au handler suivant.
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

    it("validatePasswordUpdateInput rejects non-string passwords with 400", () => {
        const req = {
            body: {
                currentPassword: 1234,
                newPassword: true,
            },
        } as unknown as Request;
        const res = createResponse();
        const next = vi.fn() as NextFunction;

        authValidator.validatePasswordUpdateInput(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                status: "error",
                message: "Current password and new password must be strings",
            }),
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("validatePasswordUpdateInput rejects a short new password with 400", () => {
        const req = {
            body: {
                currentPassword: "current-password",
                newPassword: "short",
            },
        } as Request;
        const res = createResponse();
        const next = vi.fn() as NextFunction;

        authValidator.validatePasswordUpdateInput(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                status: "error",
                message: "The new password must be at least 8 characters long",
            }),
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("validatePasswordUpdateInput rejects a reused password with 400", () => {
        const req = {
            body: {
                currentPassword: "same-password",
                newPassword: "same-password",
            },
        } as Request;
        const res = createResponse();
        const next = vi.fn() as NextFunction;

        authValidator.validatePasswordUpdateInput(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                status: "error",
                message: "The new password must be different from the current password",
            }),
        );
        expect(next).not.toHaveBeenCalled();
    });

    it("validatePasswordUpdateInput accepts valid passwords", () => {
        const req = {
            body: {
                currentPassword: "current-password",
                newPassword: "new-password-123",
            },
        } as Request;
        const res = createResponse();
        const next = vi.fn() as NextFunction;

        authValidator.validatePasswordUpdateInput(req, res, next);

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
        });

        const req = {
            headers: {
                authorization: `Bearer ${token}`,
            },
        } as AuthenticatedRequest;
        const res = createResponse();
        const next = vi.fn() as NextFunction;

        authValidator.authenticate(req, res, next);

        // Le middleware reconstruit req.user a partir du payload JWT verifie.
        expect(req.user).toEqual({
            id: "user-123",
            email: "user@example.com",
        });
        expect(next).toHaveBeenCalledOnce();
        expect(res.status).not.toHaveBeenCalled();
    });
});
