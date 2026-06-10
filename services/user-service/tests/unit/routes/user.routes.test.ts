import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const controllerMocks = vi.hoisted(() => ({
  createUserStateController: vi.fn((req, res) =>
    res.status(201).json({
      route: "create",
      method: req.method,
      body: req.body,
    }),
  ),
  getUserStateByIdController: vi.fn((req, res) =>
    res.status(200).json({
      route: "getById",
      method: req.method,
      id_user: req.params.id_user,
    }),
  ),
  updateUserStateController: vi.fn((req, res) =>
    res.status(200).json({
      route: "update",
      method: req.method,
      id_user: req.params.id_user,
      body: req.body,
    }),
  ),
  deleteUserStateController: vi.fn((req, res) =>
    res.status(200).json({
      route: "delete",
      method: req.method,
      id_user: req.params.id_user,
    }),
  ),
}));

const prismaMocks = vi.hoisted(() => ({
  $queryRaw: vi.fn(),
}));

vi.mock("../../../src/config/prisma", () => ({
  prisma: prismaMocks,
}));

vi.mock("../../../src/controllers/user.controller", () => controllerMocks);

import router from "../../../src/routes/user.routes";

const app = express();
app.use(express.json());
app.use("/users-state", router);

describe("user routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMocks.$queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the health payload", async () => {
    const response = await request(app).get("/users-state/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      service: "user-service-test",
      status: "OK",
    });
    expect(response.body.hostname).toEqual(expect.any(String));
  });

  it("returns the database health payload when Prisma responds", async () => {
    const response = await request(app).get("/users-state/health/db");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      service: "user-service-test",
      database: "OK",
      status: "OK",
    });
    expect(prismaMocks.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when the database health check fails", async () => {
    const error = new Error("db down");
    prismaMocks.$queryRaw.mockRejectedValueOnce(error);

    const response = await request(app).get("/users-state/health/db");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      service: "user-service-test",
      database: "ERROR",
      status: "KO",
      message: "Database connection failed",
    });
    expect(console.log).toHaveBeenCalledWith(error);
  });

  it("rejects POST / when the payload is invalid", async () => {
    const response = await request(app).post("/users-state").send({
      id_user: "   ",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: "error",
      message: "Invalid request data",
      errors: [
        {
          path: "id_user",
          message: "id_user is required",
        },
      ],
    });
    expect(controllerMocks.createUserStateController).not.toHaveBeenCalled();
  });

  it("routes POST / to createUserStateController", async () => {
    const response = await request(app).post("/users-state").send({
      id_user: " user-1 ",
      role: "ADMIN",
      statuts: "ACTIVE",
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      route: "create",
      method: "POST",
      body: {
        id_user: "user-1",
        role: "ADMIN",
        statuts: "ACTIVE",
      },
    });
    expect(controllerMocks.createUserStateController).toHaveBeenCalledTimes(1);
  });

  it("routes GET /:id_user to getUserStateByIdController", async () => {
    const response = await request(app).get("/users-state/user-42");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      route: "getById",
      method: "GET",
      id_user: "user-42",
    });
    expect(controllerMocks.getUserStateByIdController).toHaveBeenCalledTimes(1);
  });

  it("rejects PUT /:id_user when no update field is provided", async () => {
    const response = await request(app).put("/users-state/user-42").send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: "error",
      message: "Invalid request data",
      errors: [
        {
          path: "body",
          message: "At least one field must be provided",
        },
      ],
    });
    expect(controllerMocks.updateUserStateController).not.toHaveBeenCalled();
  });

  it("routes PUT /:id_user to updateUserStateController", async () => {
    const response = await request(app).put("/users-state/user-42").send({
      role: "MODERATOR",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      route: "update",
      method: "PUT",
      id_user: "user-42",
      body: {
        role: "MODERATOR",
      },
    });
    expect(controllerMocks.updateUserStateController).toHaveBeenCalledTimes(1);
  });

  it("routes DELETE /:id_user to deleteUserStateController", async () => {
    const response = await request(app).delete("/users-state/user-42");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      route: "delete",
      method: "DELETE",
      id_user: "user-42",
    });
    expect(controllerMocks.deleteUserStateController).toHaveBeenCalledTimes(1);
  });
});
