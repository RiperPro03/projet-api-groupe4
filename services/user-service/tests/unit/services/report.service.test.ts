import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("../../../src/config/prisma", () => ({
  prisma: {
    contentReport: prismaMocks,
  },
}));

import {
  createContentReport,
  deleteContentReport,
  getContentReportById,
  listContentReports,
  updateContentReport,
} from "../../../src/services/report.service";

describe("report.service", () => {
  const now = new Date("2026-06-22T12:00:00.000Z");
  const contentReportSelect = {
    id: true,
    message: true,
    postId: true,
    reportedUserId: true,
    createdAt: true,
    updatedAt: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listContentReports returns all content reports ordered by creation date", async () => {
    const reports = [
      {
        id: "report-1",
        message: "Contenu inapproprie",
        postId: "post-1",
        reportedUserId: null,
        createdAt: now,
        updatedAt: now,
      },
    ];

    prismaMocks.findMany.mockResolvedValue(reports);

    const result = await listContentReports();

    expect(prismaMocks.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      select: contentReportSelect,
    });
    expect(result).toEqual(reports);
  });

  it("getContentReportById returns the matching content report", async () => {
    const report = {
      id: "report-1",
      message: "Contenu inapproprie",
      postId: null,
      reportedUserId: "user-1",
      createdAt: now,
      updatedAt: now,
    };

    prismaMocks.findUnique.mockResolvedValue(report);

    const result = await getContentReportById("report-1");

    expect(prismaMocks.findUnique).toHaveBeenCalledWith({
      where: { id: "report-1" },
      select: contentReportSelect,
    });
    expect(result).toEqual(report);
  });

  it("getContentReportById throws HttpError when the report does not exist", async () => {
    prismaMocks.findUnique.mockResolvedValue(null);

    await expect(getContentReportById("missing")).rejects.toMatchObject({
      name: "HttpError",
      statusCode: 404,
      message: "Content report not found",
    });
  });

  it("createContentReport persists the message and returns the content report", async () => {
    const payload = {
      message: "Contenu inapproprie",
      postId: "post-1",
    };
    const report = {
      id: "report-1",
      ...payload,
      reportedUserId: null,
      createdAt: now,
      updatedAt: now,
    };

    prismaMocks.create.mockResolvedValue(report);

    const result = await createContentReport(payload);

    expect(prismaMocks.create).toHaveBeenCalledWith({
      data: payload,
      select: contentReportSelect,
    });
    expect(result).toEqual(report);
  });

  it("updateContentReport updates and returns the content report", async () => {
    const report = {
      id: "report-1",
      message: "Message modifie",
      postId: "post-1",
      reportedUserId: null,
      createdAt: now,
      updatedAt: now,
    };

    prismaMocks.update.mockResolvedValue(report);

    const result = await updateContentReport("report-1", {
      message: "Message modifie",
    });

    expect(prismaMocks.update).toHaveBeenCalledWith({
      where: { id: "report-1" },
      data: { message: "Message modifie" },
      select: contentReportSelect,
    });
    expect(result).toEqual(report);
  });

  it("updateContentReport clears postId when a reportedUserId is provided", async () => {
    const report = {
      id: "report-1",
      message: "Contenu inapproprie",
      postId: null,
      reportedUserId: "user-1",
      createdAt: now,
      updatedAt: now,
    };

    prismaMocks.update.mockResolvedValue(report);

    const result = await updateContentReport("report-1", {
      reportedUserId: "user-1",
    });

    expect(prismaMocks.update).toHaveBeenCalledWith({
      where: { id: "report-1" },
      data: { reportedUserId: "user-1", postId: null },
      select: contentReportSelect,
    });
    expect(result).toEqual(report);
  });

  it("updateContentReport maps missing rows to HttpError", async () => {
    prismaMocks.update.mockRejectedValue({ code: "P2025" });

    await expect(
      updateContentReport("missing", {
        message: "Message modifie",
      }),
    ).rejects.toMatchObject({
      name: "HttpError",
      statusCode: 404,
      message: "Content report not found",
    });
  });

  it("deleteContentReport deletes the content report", async () => {
    prismaMocks.delete.mockResolvedValue(undefined);

    await deleteContentReport("report-1");

    expect(prismaMocks.delete).toHaveBeenCalledWith({
      where: { id: "report-1" },
    });
  });

  it("deleteContentReport maps missing rows to HttpError", async () => {
    prismaMocks.delete.mockRejectedValue({ code: "P2025" });

    await expect(deleteContentReport("missing")).rejects.toMatchObject({
      name: "HttpError",
      statusCode: 404,
      message: "Content report not found",
    });
  });
});
