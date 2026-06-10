import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const controllerMocks = vi.hoisted(() => ({
  createProfileController: vi.fn((req, res) =>
    res.status(201).json({ route: "create", method: req.method }),
  ),
  getProfilesController: vi.fn((req, res) =>
    res.status(200).json({ route: "list", method: req.method }),
  ),
  getProfileByIdController: vi.fn((req, res) =>
    res.status(200).json({
      route: "getById",
      method: req.method,
      id_user: req.params.id_user,
    }),
  ),
  updateProfileController: vi.fn((req, res) =>
    res.status(200).json({
      route: "update",
      method: req.method,
      id_user: req.params.id_user,
      body: req.body,
    }),
  ),
  deleteProfileController: vi.fn((req, res) =>
    res.status(200).json({
      route: "delete",
      method: req.method,
      id_user: req.params.id_user,
    }),
  ),
}));

const getDatabaseStatusMock = vi.hoisted(() =>
  vi.fn(() => ({ status: "connected" })),
);

vi.mock("../../../src/config/database", () => ({
  getDatabaseStatus: getDatabaseStatusMock,
}));

vi.mock("../../../src/controllers/profile.controller", () => controllerMocks);

import router from "../../../src/routes/profile.routes";

const app = express();
app.use(express.json());
app.use("/profiles", router);

describe("profile routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getDatabaseStatusMock.mockReturnValue({ status: "connected" });
  });

  it("returns the health payload", async () => {
    const response = await request(app).get("/profiles/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      service: "profile-service-test",
      status: "OK",
      database: { status: "connected" },
    });
    expect(response.body.hostname).toEqual(expect.any(String));
    expect(getDatabaseStatusMock).toHaveBeenCalledTimes(1);
  });

  it("routes PUT /:id_user to updateProfileController", async () => {
    const payload = { username: "alice" };

    const response = await request(app).put("/profiles/42").send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      route: "update",
      method: "PUT",
      id_user: "42",
      body: payload,
    });
    expect(controllerMocks.updateProfileController).toHaveBeenCalledTimes(1);
  });

  it("routes PATCH /:id_user to updateProfileController", async () => {
    const payload = { nickname: "ally" };

    const response = await request(app).patch("/profiles/42").send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      route: "update",
      method: "PATCH",
      id_user: "42",
      body: payload,
    });
    expect(controllerMocks.updateProfileController).toHaveBeenCalledTimes(1);
  });

  it("routes POST / to createProfileController", async () => {
    const response = await request(app).post("/profiles").send({
      username: "alice",
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      route: "create",
      method: "POST",
    });
    expect(controllerMocks.createProfileController).toHaveBeenCalledTimes(1);
  });

  it("routes GET / to getProfilesController", async () => {
    const response = await request(app).get("/profiles");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      route: "list",
      method: "GET",
    });
    expect(controllerMocks.getProfilesController).toHaveBeenCalledTimes(1);
  });

  it("routes GET /:id_user to getProfileByIdController", async () => {
    const response = await request(app).get("/profiles/42");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      route: "getById",
      method: "GET",
      id_user: "42",
    });
    expect(controllerMocks.getProfileByIdController).toHaveBeenCalledTimes(1);
  });

  it("routes DELETE /:id_user to deleteProfileController", async () => {
    const response = await request(app).delete("/profiles/42");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      route: "delete",
      method: "DELETE",
      id_user: "42",
    });
    expect(controllerMocks.deleteProfileController).toHaveBeenCalledTimes(1);
  });
});
