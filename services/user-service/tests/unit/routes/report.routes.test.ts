import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const controllerMocks = vi.hoisted(() => ({
  createContentReportController: vi.fn((req, res) =>
    res.status(201).json({
      route: "create",
      method: req.method,
      body: req.body,
    }),
  ),
  deleteContentReportController: vi.fn((req, res) =>
    res.status(200).json({
      route: "delete",
      method: req.method,
      id: req.params.id,
    }),
  ),
  getContentReportByIdController: vi.fn((req, res) =>
    res.status(200).json({
      route: "getById",
      method: req.method,
      id: req.params.id,
    }),
  ),
  listContentReportsController: vi.fn((req, res) =>
    res.status(200).json({
      route: "list",
      method: req.method,
    }),
  ),
  updateContentReportController: vi.fn((req, res) =>
    res.status(200).json({
      route: "update",
      method: req.method,
      id: req.params.id,
      body: req.body,
    }),
  ),
}));

vi.mock("../../../src/controllers/report.controller", () => controllerMocks);

import router from "../../../src/routes/report.routes";

const app = express();
app.use(express.json());
app.use("/users-state/reports", router);

describe("report routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects POST / when the payload is invalid", async () => {
    const response = await request(app).post("/users-state/reports").send({
      message: "   ",
      postId: "post-1",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: "error",
      message: "Invalid request data",
      errors: [
        {
          path: "message",
          message: "message is required",
        },
      ],
    });
    expect(controllerMocks.createContentReportController).not.toHaveBeenCalled();
  });

  it("rejects POST / when no report target is provided", async () => {
    const response = await request(app).post("/users-state/reports").send({
      message: "Contenu inapproprie",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: "error",
      message: "Invalid request data",
      errors: [
        {
          path: "body",
          message:
            "Exactly one of postId, commentId or reportedUserId must be provided",
        },
      ],
    });
    expect(controllerMocks.createContentReportController).not.toHaveBeenCalled();
  });

  it("rejects POST / when both report targets are provided", async () => {
    const response = await request(app).post("/users-state/reports").send({
      message: "Contenu inapproprie",
      postId: "post-1",
      commentId: "comment-1",
      reportedUserId: "user-1",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: "error",
      message: "Invalid request data",
      errors: [
        {
          path: "body",
          message:
            "Exactly one of postId, commentId or reportedUserId must be provided",
        },
      ],
    });
    expect(controllerMocks.createContentReportController).not.toHaveBeenCalled();
  });

  it("routes POST / to createContentReportController", async () => {
    const response = await request(app).post("/users-state/reports").send({
      message: " Contenu inapproprie ",
      postId: " post-1 ",
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      route: "create",
      method: "POST",
      body: {
        message: "Contenu inapproprie",
        postId: "post-1",
      },
    });
    expect(controllerMocks.createContentReportController).toHaveBeenCalledTimes(
      1,
    );
  });

  it("routes GET / to listContentReportsController", async () => {
    const response = await request(app).get("/users-state/reports");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      route: "list",
      method: "GET",
    });
    expect(controllerMocks.listContentReportsController).toHaveBeenCalledTimes(1);
  });

  it("routes GET /:id to getContentReportByIdController", async () => {
    const response = await request(app).get("/users-state/reports/report-1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      route: "getById",
      method: "GET",
      id: "report-1",
    });
    expect(controllerMocks.getContentReportByIdController).toHaveBeenCalledTimes(
      1,
    );
  });

  it("rejects PUT /:id when the payload is invalid", async () => {
    const response = await request(app).put("/users-state/reports/report-1").send({
      message: "   ",
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      status: "error",
      message: "Invalid request data",
      errors: [
        {
          path: "message",
          message: "message is required",
        },
      ],
    });
    expect(controllerMocks.updateContentReportController).not.toHaveBeenCalled();
  });

  it("routes PUT /:id to updateContentReportController", async () => {
    const response = await request(app).put("/users-state/reports/report-1").send({
      message: " Message modifie ",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      route: "update",
      method: "PUT",
      id: "report-1",
      body: {
        message: "Message modifie",
      },
    });
    expect(controllerMocks.updateContentReportController).toHaveBeenCalledTimes(
      1,
    );
  });

  it("routes DELETE /:id to deleteContentReportController", async () => {
    const response = await request(app).delete("/users-state/reports/report-1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      route: "delete",
      method: "DELETE",
      id: "report-1",
    });
    expect(controllerMocks.deleteContentReportController).toHaveBeenCalledTimes(
      1,
    );
  });
});
