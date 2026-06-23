import type { NextFunction, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthenticatedRequest } from "../../src/middlewares/auth.middleware";

const authServiceMocks = vi.hoisted(() => ({
  verifyAccessToken: vi.fn(),
}));

const userServiceMocks = vi.hoisted(() => ({
  getCurrentUserRole: vi.fn(),
}));

vi.mock("../../src/services/auth.service", () => ({
  verifyAccessToken: authServiceMocks.verifyAccessToken,
}));

vi.mock("../../src/services/user.service", () => ({
  getCurrentUserRole: userServiceMocks.getCurrentUserRole,
}));

import {
  authMiddleware,
  optionalAuthMiddleware,
  unauthorizedPayload,
} from "../../src/middlewares/auth.middleware";
import { ServiceError } from "../../src/utils/http-client";

type MockResponse = Response & {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  locals: {
    body?: unknown;
  };
};

type RequestOptions = {
  method?: string;
  headers?: Record<string, string | undefined>;
};

const createResponse = (): MockResponse => {
  const response = {
    locals: {},
  } as MockResponse;

  response.status = vi.fn((statusCode: number) => {
    response.statusCode = statusCode;
    return response;
  }) as MockResponse["status"];

  response.json = vi.fn((body: unknown) => {
    response.locals.body = body;
    return response;
  }) as MockResponse["json"];

  return response;
};

const createRequest = ({
  method = "GET",
  headers = {},
}: RequestOptions = {}) => {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  ) as Record<string, string | undefined>;

  return {
    method,
    headers: { ...normalizedHeaders },
    header: vi.fn((name: string) => normalizedHeaders[name.toLowerCase()]),
  } as unknown as AuthenticatedRequest;
};

describe("auth middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    authServiceMocks.verifyAccessToken.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      role: "USER",
    });
    userServiceMocks.getCurrentUserRole.mockResolvedValue("MODERATOR");
  });

  it("attaches the authenticated user from a bearer token", async () => {
    const req = createRequest({
      headers: {
        authorization: "Bearer access-token",
        "x-request-id": "request-1",
      },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await authMiddleware(req, res, next);

    expect(authServiceMocks.verifyAccessToken).toHaveBeenCalledWith(
      "Bearer access-token",
      "request-1",
    );
    expect(userServiceMocks.getCurrentUserRole).toHaveBeenCalledWith(
      "user-1",
      "Bearer access-token",
      "request-1",
    );
    expect(req.authUser).toEqual({
      id: "user-1",
      email: "user@example.com",
      role: "MODERATOR",
    });
    expect(req.headers.authorization).toBe("Bearer access-token");
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("accepts the access token cookie when no bearer header is provided", async () => {
    const req = createRequest({
      headers: {
        cookie: "theme=dark; accessToken=cookie-token",
      },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await authMiddleware(req, res, next);

    expect(authServiceMocks.verifyAccessToken).toHaveBeenCalledWith(
      "Bearer cookie-token",
      undefined,
    );
    expect(req.headers.authorization).toBe("Bearer cookie-token");
    expect(next).toHaveBeenCalledOnce();
  });

  it("returns unauthorized when authentication is required and no token exists", async () => {
    const req = createRequest();
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(unauthorizedPayload);
    expect(next).not.toHaveBeenCalled();
    expect(authServiceMocks.verifyAccessToken).not.toHaveBeenCalled();
  });

  it("normalizes auth-service 401 and 403 errors to gateway unauthorized responses", async () => {
    authServiceMocks.verifyAccessToken.mockRejectedValue(
      new ServiceError("auth", 403, "Forbidden"),
    );
    const req = createRequest({
      headers: {
        authorization: "Bearer revoked-token",
      },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(unauthorizedPayload);
    expect(next).not.toHaveBeenCalled();
  });

  it("lets optional auth continue when no token is provided", async () => {
    const req = createRequest();
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await optionalAuthMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(authServiceMocks.verifyAccessToken).not.toHaveBeenCalled();
  });

  it("skips authentication for OPTIONS requests", async () => {
    const req = createRequest({ method: "OPTIONS" });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
    expect(authServiceMocks.verifyAccessToken).not.toHaveBeenCalled();
  });
});
