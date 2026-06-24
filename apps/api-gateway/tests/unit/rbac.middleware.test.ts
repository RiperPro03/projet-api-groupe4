import type { NextFunction, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthenticatedRequest } from "../../src/middlewares/auth.middleware";

const httpClientMocks = vi.hoisted(() => ({
  requestService: vi.fn(),
}));

vi.mock("../../src/utils/http-client", () => ({
  requestService: httpClientMocks.requestService,
}));

import {
  allowVisitorOrRoles,
  forbidModeratorAdminUserAccess,
  requireBodyOwnerOrRoles,
  requireCommentOwnerOrRoles,
  requireOwnerOrRoles,
  requireParamOwnerOrRoles,
  requirePostOwnerOrRoles,
  requireRoles,
} from "../../src/middlewares/rbac.middleware";

type MockResponse = Response & {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  locals: {
    body?: unknown;
  };
};

type RequestOptions = {
  authUser?: {
    id?: string;
    role?: string;
  };
  body?: Record<string, unknown>;
  headers?: Record<string, string | undefined>;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
};

const forbiddenPayload = {
  status: "error",
  message: "Forbidden",
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
  authUser,
  body = {},
  headers = {},
  params = {},
  query = {},
}: RequestOptions = {}) => {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]),
  ) as Record<string, string | undefined>;

  return {
    authUser,
    body,
    headers: normalizedHeaders,
    params,
    query,
    header: vi.fn((name: string) => normalizedHeaders[name.toLowerCase()]),
  } as unknown as AuthenticatedRequest;
};

describe("RBAC middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows requests with one of the required roles", () => {
    const req = createRequest({
      authUser: {
        id: "admin-1",
        role: "ADMIN",
      },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    requireRoles(["ADMIN"])(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("forbids requests without the required role", () => {
    const req = createRequest({
      authUser: {
        id: "user-1",
        role: "USER",
      },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    requireRoles(["MODERATOR", "ADMIN"])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(forbiddenPayload);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows visitors but blocks authenticated users with unexpected roles", () => {
    const visitorReq = createRequest();
    const blockedReq = createRequest({
      authUser: {
        id: "user-1",
        role: "USER",
      },
    });
    const visitorRes = createResponse();
    const blockedRes = createResponse();
    const visitorNext = vi.fn() as NextFunction;
    const blockedNext = vi.fn() as NextFunction;

    const middleware = allowVisitorOrRoles(["ADMIN"]);

    middleware(visitorReq, visitorRes, visitorNext);
    middleware(blockedReq, blockedRes, blockedNext);

    expect(visitorNext).toHaveBeenCalledOnce();
    expect(visitorRes.status).not.toHaveBeenCalled();
    expect(blockedRes.status).toHaveBeenCalledWith(403);
    expect(blockedNext).not.toHaveBeenCalled();
  });

  it("allows owners identified from params, query, or body fields", () => {
    const paramReq = createRequest({
      authUser: { id: "user-1", role: "USER" },
      params: { userId: "user-1" },
    });
    const queryReq = createRequest({
      authUser: { id: "user-1", role: "USER" },
      query: { userId: [" user-1 "] },
    });
    const bodyReq = createRequest({
      authUser: { id: "user-1", role: "USER" },
      body: { authorId: "user-1" },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    requireParamOwnerOrRoles({
      roles: ["ADMIN"],
      ownerParam: "userId",
    })(paramReq, res, next);
    requireOwnerOrRoles({
      roles: ["ADMIN"],
      ownerQueryParam: "userId",
    })(queryReq, res, next);
    requireBodyOwnerOrRoles({
      roles: ["ADMIN"],
      ownerBodyField: "authorId",
    })(bodyReq, res, next);

    expect(next).toHaveBeenCalledTimes(3);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("forbids owner rules when the authenticated user does not match", () => {
    const req = createRequest({
      authUser: {
        id: "user-1",
        role: "USER",
      },
      params: {
        userId: "user-2",
      },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    requireParamOwnerOrRoles({
      roles: ["ADMIN"],
      ownerParam: "userId",
    })(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(forbiddenPayload);
    expect(next).not.toHaveBeenCalled();
  });

  it("forbids moderators from accessing admin user targets", async () => {
    httpClientMocks.requestService.mockResolvedValueOnce({
      data: {
        data: {
          id_user: "admin-1",
          role: "ADMIN",
          statuts: "ACTIVE",
        },
      },
    });
    const req = createRequest({
      authUser: {
        id: "moderator-1",
        role: "MODERATOR",
      },
      headers: {
        authorization: "Bearer token",
        "x-request-id": "request-1",
      },
      params: {
        id_user: "admin-1",
      },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await forbidModeratorAdminUserAccess("id_user")(req, res, next);

    expect(httpClientMocks.requestService).toHaveBeenCalledWith(
      "users",
      expect.objectContaining({
        method: "GET",
        url: expect.stringContaining("/users/admin-1"),
        headers: {
          Authorization: "Bearer token",
          "x-request-id": "request-1",
        },
      }),
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(forbiddenPayload);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows moderators to access non-admin user targets", async () => {
    httpClientMocks.requestService.mockResolvedValueOnce({
      data: {
        data: {
          id_user: "user-2",
          role: "USER",
          statuts: "ACTIVE",
        },
      },
    });
    const req = createRequest({
      authUser: {
        id: "moderator-1",
        role: "MODERATOR",
      },
      params: {
        id_user: "user-2",
      },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await forbidModeratorAdminUserAccess("id_user")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("allows admins to access admin user targets without target lookup", async () => {
    const req = createRequest({
      authUser: {
        id: "admin-1",
        role: "ADMIN",
      },
      body: {
        role: "ADMIN",
      },
      params: {
        id_user: "admin-2",
      },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await forbidModeratorAdminUserAccess("id_user")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(httpClientMocks.requestService).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("forbids moderators from promoting user targets to admin", async () => {
    const req = createRequest({
      authUser: {
        id: "moderator-1",
        role: "MODERATOR",
      },
      body: {
        role: "ADMIN",
      },
      params: {
        id_user: "user-2",
      },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await forbidModeratorAdminUserAccess("id_user")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(forbiddenPayload);
    expect(httpClientMocks.requestService).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("forbids moderators from updating their own role", async () => {
    const req = createRequest({
      authUser: {
        id: "moderator-1",
        role: "MODERATOR",
      },
      body: {
        role: "USER",
      },
      params: {
        id_user: "moderator-1",
      },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await forbidModeratorAdminUserAccess("id_user")(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(forbiddenPayload);
    expect(httpClientMocks.requestService).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("allows moderators to update their own status", async () => {
    httpClientMocks.requestService.mockResolvedValueOnce({
      data: {
        data: {
          id_user: "moderator-1",
          role: "MODERATOR",
          statuts: "ACTIVE",
        },
      },
    });
    const req = createRequest({
      authUser: {
        id: "moderator-1",
        role: "MODERATOR",
      },
      body: {
        statuts: "INACTIVE",
      },
      params: {
        id_user: "moderator-1",
      },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await forbidModeratorAdminUserAccess("id_user")(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("allows moderators and admins to bypass post owner lookup", async () => {
    const req = createRequest({
      authUser: {
        id: "moderator-1",
        role: "MODERATOR",
      },
      params: {
        id: "post-1",
      },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await requirePostOwnerOrRoles(["MODERATOR", "ADMIN"])(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(httpClientMocks.requestService).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("allows the author of a post returned by post-service", async () => {
    httpClientMocks.requestService.mockResolvedValue({
      data: {
        data: {
          post: {
            authorId: "user-1",
          },
        },
      },
    });
    const req = createRequest({
      authUser: {
        id: "user-1",
        role: "USER",
      },
      headers: {
        "x-request-id": "request-1",
      },
      params: {
        id: "post-1",
      },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await requirePostOwnerOrRoles(["MODERATOR", "ADMIN"])(req, res, next);

    expect(httpClientMocks.requestService).toHaveBeenCalledWith(
      "posts",
      expect.objectContaining({
        method: "GET",
        url: expect.stringContaining("/posts/post-1"),
        headers: {
          "x-request-id": "request-1",
        },
      }),
    );
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("forbids post owner access when post-service returns another author", async () => {
    httpClientMocks.requestService.mockResolvedValue({
      data: {
        data: {
          post: {
            authorId: "user-2",
          },
        },
      },
    });
    const req = createRequest({
      authUser: {
        id: "user-1",
        role: "USER",
      },
      params: {
        id: "post-1",
      },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await requirePostOwnerOrRoles(["MODERATOR", "ADMIN"])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(forbiddenPayload);
    expect(next).not.toHaveBeenCalled();
  });

  it("passes post-service lookup errors to the error handler", async () => {
    const serviceError = new Error("post-service unavailable");

    httpClientMocks.requestService.mockRejectedValue(serviceError);
    const req = createRequest({
      authUser: {
        id: "user-1",
        role: "USER",
      },
      params: {
        id: "post-1",
      },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await requirePostOwnerOrRoles(["MODERATOR", "ADMIN"])(req, res, next);

    expect(next).toHaveBeenCalledWith(serviceError);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("allows the author of a comment returned by interaction-service", async () => {
    httpClientMocks.requestService.mockResolvedValue({
      data: {
        data: {
          comment: {
            authorId: "user-1",
          },
        },
      },
    });
    const req = createRequest({
      authUser: {
        id: "user-1",
        role: "USER",
      },
      headers: {
        "x-request-id": "request-1",
      },
      params: {
        commentId: "comment-1",
      },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await requireCommentOwnerOrRoles([])(req, res, next);

    expect(httpClientMocks.requestService).toHaveBeenCalledWith(
      "interactions",
      expect.objectContaining({
        method: "GET",
        url: expect.stringContaining("/comments/comment-1"),
        headers: {
          "x-request-id": "request-1",
        },
      }),
    );
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("forbids comment owner access when interaction-service returns another author", async () => {
    httpClientMocks.requestService.mockResolvedValue({
      data: {
        data: {
          comment: {
            authorId: "user-2",
          },
        },
      },
    });
    const req = createRequest({
      authUser: {
        id: "user-1",
        role: "USER",
      },
      params: {
        commentId: "comment-1",
      },
    });
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    await requireCommentOwnerOrRoles([])(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(forbiddenPayload);
    expect(next).not.toHaveBeenCalled();
  });
});
