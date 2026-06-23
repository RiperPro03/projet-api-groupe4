import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

const serviceMocks = vi.hoisted(() => ({
  generatePresignedUrl: vi.fn(),
  getMediaByKey: vi.fn(),
  deleteMedia: vi.fn(),
}));

vi.mock("../src/services/media.service", () => ({
  default: serviceMocks,
}));

import mediaController from "../src/controllers/media.controller";

const createResponse = () => {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  } as unknown as Response;

  vi.mocked(res.status).mockReturnValue(res);
  vi.mocked(res.json).mockReturnValue(res);

  return res;
};

const createRequest = (
  overrides: Partial<Request> & { headers?: Record<string, string> } = {},
) => {
  const headers = overrides.headers ?? {};

  return {
    body: {},
    params: {},
    header: vi.fn((name: string) => headers[name.toLowerCase()]),
    ...overrides,
  } as unknown as Request;
};

describe("media.controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuse une URL presignee sans utilisateur authentifie", async () => {
    const req = createRequest();
    const res = createResponse();

    await mediaController.getPresignedUrl(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Missing authenticated user",
    });
  });

  it("genere une URL presignee avec usage general par defaut", async () => {
    serviceMocks.generatePresignedUrl.mockResolvedValue({
      uploadUrl: "http://localhost:9000/upload",
      objectKey: "general/user-a/file.png",
      publicUrl: "http://cdn.test/file.png",
      expiresIn: 300,
    });
    const req = createRequest({
      headers: { "x-user-id": " user-a " },
      body: {
        filename: "file.png",
        mimeType: "image/png",
        size: 1024,
        usage: "unknown",
      },
    });
    const res = createResponse();

    await mediaController.getPresignedUrl(req, res);

    expect(serviceMocks.generatePresignedUrl).toHaveBeenCalledWith({
      filename: "file.png",
      mimeType: "image/png",
      size: 1024,
      alt: undefined,
      ownerId: "user-a",
      usage: "general",
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("retourne 404 quand un media est introuvable", async () => {
    serviceMocks.getMediaByKey.mockRejectedValue(new Error("MEDIA_NOT_FOUND"));
    const req = createRequest({
      params: { objectKey: "missing.png" },
    }) as Request<{ objectKey: string }>;
    const res = createResponse();

    await mediaController.getMedia(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Media not found",
    });
  });

  it("retourne 403 quand le proprietaire ne correspond pas", async () => {
    serviceMocks.deleteMedia.mockRejectedValue(new Error("MEDIA_FORBIDDEN"));
    const req = createRequest({
      headers: { "x-user-id": "user-b" },
      params: { objectKey: "posts/user-a/file.png" },
    }) as Request<{ objectKey: string }>;
    const res = createResponse();

    await mediaController.deleteMedia(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Forbidden",
    });
  });
});
