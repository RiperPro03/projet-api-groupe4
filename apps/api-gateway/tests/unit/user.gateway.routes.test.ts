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

describe("user gateway report RBAC routes", () => {
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
});
