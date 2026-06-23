import express from "express";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  authMiddleware: vi.fn((req, res, next) => {
    const role = req.header("x-test-role");

    if (!role) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    (req as typeof req & { authUser?: { id: string; role: string } }).authUser =
      {
        id: req.header("x-test-user-id") ?? "user-1",
        role,
      };

    return next();
  }),
}));

const httpClientMocks = vi.hoisted(() => ({
  forwardHandler: vi.fn((req, res) =>
    res.status(200).json({
      status: "forwarded",
      method: req.method,
      path: req.path,
    }),
  ),
  requestService: vi.fn(),
}));

vi.mock("../../src/middlewares/auth.middleware", () => ({
  authMiddleware: authMocks.authMiddleware,
}));

vi.mock("../../src/utils/http-client", () => ({
  createForwardHandler: vi.fn(() => httpClientMocks.forwardHandler),
  requestService: httpClientMocks.requestService,
}));

import userGatewayRoutes from "../../src/routes/user.gateway.routes";

const createApp = () => {
  const app = express();

  app.use(express.json());
  app.use("/users", userGatewayRoutes);

  return app;
};

const listen = (server: Server) =>
  new Promise<string>((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address() as AddressInfo;

      resolve(`http://127.0.0.1:${address.port}`);
    });
  });

const close = (server: Server) =>
  new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

describe("user gateway RBAC routes", () => {
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    server = createServer(createApp());
    baseUrl = await listen(server);
  });

  afterEach(async () => {
    await close(server);
  });

  it("requires authentication before accessing report routes", async () => {
    const response = await fetch(`${baseUrl}/users/reports`, {
      method: "POST",
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      status: "error",
      message: "Unauthorized",
    });
    expect(httpClientMocks.forwardHandler).not.toHaveBeenCalled();
  });

  it("allows authenticated users to create reports", async () => {
    const response = await fetch(`${baseUrl}/users/reports`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-test-role": "USER",
      },
      body: JSON.stringify({
        message: "Contenu inapproprie",
        postId: "post-1",
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "forwarded",
      method: "POST",
      path: "/reports",
    });
  });

  it("forbids regular users from administering reports", async () => {
    for (const [method, path] of [
      ["GET", "/users/reports"],
      ["GET", "/users/reports/report-1"],
      ["PUT", "/users/reports/report-1"],
      ["DELETE", "/users/reports/report-1"],
    ] as const) {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          "x-test-role": "USER",
        },
      });

      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        status: "error",
        message: "Forbidden",
      });
    }
  });

  it.each(["MODERATOR", "ADMIN"] as const)(
    "allows %s to administer reports",
    async (role) => {
      for (const [method, path, forwardedPath] of [
        ["GET", "/users/reports", "/reports"],
        ["GET", "/users/reports/report-1", "/reports/report-1"],
        ["PUT", "/users/reports/report-1", "/reports/report-1"],
        ["DELETE", "/users/reports/report-1", "/reports/report-1"],
      ] as const) {
        const response = await fetch(`${baseUrl}${path}`, {
          method,
          headers: {
            "x-test-role": role,
          },
        });

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
          status: "forwarded",
          method,
          path: forwardedPath,
        });
      }
    },
  );

  it("forbids moderators from reading admin user states", async () => {
    httpClientMocks.requestService.mockResolvedValueOnce({
      data: {
        data: {
          id_user: "admin-1",
          role: "ADMIN",
          statuts: "ACTIVE",
        },
      },
    });

    const response = await fetch(`${baseUrl}/users/admin-1`, {
      headers: {
        "x-test-role": "MODERATOR",
        "x-test-user-id": "moderator-1",
      },
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      status: "error",
      message: "Forbidden",
    });
    expect(httpClientMocks.forwardHandler).not.toHaveBeenCalled();
  });

  it("allows admins to read admin user states", async () => {
    const response = await fetch(`${baseUrl}/users/admin-1`, {
      headers: {
        "x-test-role": "ADMIN",
        "x-test-user-id": "admin-1",
      },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "forwarded",
      method: "GET",
      path: "/admin-1",
    });
    expect(httpClientMocks.requestService).not.toHaveBeenCalled();
  });

  it("allows moderators to update non-admin user states", async () => {
    httpClientMocks.requestService.mockResolvedValueOnce({
      data: {
        data: {
          id_user: "user-2",
          role: "USER",
          statuts: "ACTIVE",
        },
      },
    });

    const response = await fetch(`${baseUrl}/users/user-2`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "x-test-role": "MODERATOR",
        "x-test-user-id": "moderator-1",
      },
      body: JSON.stringify({
        statuts: "INACTIVE",
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "forwarded",
      method: "PUT",
      path: "/user-2",
    });
  });

  it("forbids moderators from promoting user states to admin", async () => {
    const response = await fetch(`${baseUrl}/users/user-2`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "x-test-role": "MODERATOR",
        "x-test-user-id": "moderator-1",
      },
      body: JSON.stringify({
        role: "ADMIN",
      }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      status: "error",
      message: "Forbidden",
    });
    expect(httpClientMocks.requestService).not.toHaveBeenCalled();
    expect(httpClientMocks.forwardHandler).not.toHaveBeenCalled();
  });

  it("forbids moderators from changing their own role", async () => {
    const response = await fetch(`${baseUrl}/users/moderator-1`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "x-test-role": "MODERATOR",
        "x-test-user-id": "moderator-1",
      },
      body: JSON.stringify({
        role: "USER",
      }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      status: "error",
      message: "Forbidden",
    });
    expect(httpClientMocks.requestService).not.toHaveBeenCalled();
    expect(httpClientMocks.forwardHandler).not.toHaveBeenCalled();
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

    const response = await fetch(`${baseUrl}/users/moderator-1`, {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "x-test-role": "MODERATOR",
        "x-test-user-id": "moderator-1",
      },
      body: JSON.stringify({
        statuts: "INACTIVE",
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "forwarded",
      method: "PUT",
      path: "/moderator-1",
    });
  });
});
