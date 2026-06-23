import type { Request } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ContentReportParams,
  CreateContentReportInput,
  UpdateContentReportInput,
} from "../../../src/models/report.model";
import { createMockResponse } from "../../utils/mock-response";

const serviceMocks = vi.hoisted(() => {
  class MockHttpError extends Error {
    constructor(
      public readonly statusCode: number,
      message: string,
    ) {
      super(message);
      this.name = "HttpError";
    }
  }

  return {
    HttpError: MockHttpError,
    createContentReport: vi.fn(),
    deleteContentReport: vi.fn(),
    getContentReportById: vi.fn(),
    listContentReports: vi.fn(),
    updateContentReport: vi.fn(),
  };
});

vi.mock("../../../src/services/report.service", () => ({
  createContentReport: serviceMocks.createContentReport,
  deleteContentReport: serviceMocks.deleteContentReport,
  getContentReportById: serviceMocks.getContentReportById,
  listContentReports: serviceMocks.listContentReports,
  updateContentReport: serviceMocks.updateContentReport,
}));

vi.mock("../../../src/services/user.service", () => ({
  HttpError: serviceMocks.HttpError,
}));

import {
  createContentReportController,
  deleteContentReportController,
  getContentReportByIdController,
  listContentReportsController,
  updateContentReportController,
} from "../../../src/controllers/report.controller";

type CreateContentReportRequest = Request<
  Record<string, never>,
  unknown,
  CreateContentReportInput
>;
type GetContentReportRequest = Request<ContentReportParams>;
type UpdateContentReportRequest = Request<
  ContentReportParams,
  unknown,
  UpdateContentReportInput
>;

describe("report.controller", () => {
  const now = new Date("2026-06-22T12:00:00.000Z");
  const report = {
    id: "report-1",
    message: "Contenu inapproprie",
    postId: "post-1",
    reportedUserId: null,
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createContentReportController returns 201 with the created report", async () => {
    const req = {
      body: {
        message: "Contenu inapproprie",
        postId: "post-1",
      },
    } as CreateContentReportRequest;
    const res = createMockResponse();

    serviceMocks.createContentReport.mockResolvedValue(report);

    await createContentReportController(req, res, vi.fn());

    expect(serviceMocks.createContentReport).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Content report created successfully",
      data: report,
    });
  });

  it("listContentReportsController returns 200 with all reports", async () => {
    const req = {} as Request;
    const res = createMockResponse();

    serviceMocks.listContentReports.mockResolvedValue([report]);

    await listContentReportsController(req, res, vi.fn());

    expect(serviceMocks.listContentReports).toHaveBeenCalledWith();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Content reports retrieved successfully",
      data: [report],
    });
  });

  it("getContentReportByIdController returns 200 with the requested report", async () => {
    const req = {
      params: {
        id: "report-1",
      },
    } as GetContentReportRequest;
    const res = createMockResponse();

    serviceMocks.getContentReportById.mockResolvedValue(report);

    await getContentReportByIdController(req, res, vi.fn());

    expect(serviceMocks.getContentReportById).toHaveBeenCalledWith("report-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Content report retrieved successfully",
      data: report,
    });
  });

  it("updateContentReportController returns 200 with the updated report", async () => {
    const req = {
      params: {
        id: "report-1",
      },
      body: {
        message: "Message modifie",
      },
    } as UpdateContentReportRequest;
    const res = createMockResponse();
    const updatedReport = {
      ...report,
      message: "Message modifie",
    };

    serviceMocks.updateContentReport.mockResolvedValue(updatedReport);

    await updateContentReportController(req, res, vi.fn());

    expect(serviceMocks.updateContentReport).toHaveBeenCalledWith("report-1", {
      message: "Message modifie",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Content report updated successfully",
      data: updatedReport,
    });
  });

  it("deleteContentReportController returns 200 after deletion", async () => {
    const req = {
      params: {
        id: "report-1",
      },
    } as GetContentReportRequest;
    const res = createMockResponse();

    serviceMocks.deleteContentReport.mockResolvedValue(undefined);

    await deleteContentReportController(req, res, vi.fn());

    expect(serviceMocks.deleteContentReport).toHaveBeenCalledWith("report-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Content report deleted successfully",
    });
  });

  it("maps HttpError instances to their status code and message", async () => {
    const req = {
      params: {
        id: "missing",
      },
    } as GetContentReportRequest;
    const res = createMockResponse();

    serviceMocks.getContentReportById.mockRejectedValue(
      new serviceMocks.HttpError(404, "Content report not found"),
    );

    await getContentReportByIdController(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Content report not found",
    });
  });

  it("returns 500 for unexpected service errors", async () => {
    const req = {
      body: {
        message: "Contenu inapproprie",
      },
    } as CreateContentReportRequest;
    const res = createMockResponse();
    const error = new Error("unexpected");

    vi.spyOn(console, "error").mockImplementation(() => undefined);
    serviceMocks.createContentReport.mockRejectedValue(error);

    await createContentReportController(req, res, vi.fn());

    expect(console.error).toHaveBeenCalledWith(error);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Internal server error",
    });
  });
});
