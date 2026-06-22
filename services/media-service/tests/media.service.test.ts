import { beforeEach, describe, expect, it, vi } from "vitest";

const mediaMocks = vi.hoisted(() => ({
  create: vi.fn(),
  findOne: vi.fn(),
  deleteOne: vi.fn(),
}));

const minioMocks = vi.hoisted(() => ({
  presignedPutObject: vi.fn(),
  removeObject: vi.fn(),
  buildPublicObjectUrl: vi.fn(),
  toBrowserMinioUrl: vi.fn(),
}));

vi.mock("uuid", () => ({
  v4: () => "fixed-media-id",
}));

vi.mock("../src/models/media.model", () => ({
  Media: {
    create: mediaMocks.create,
    findOne: mediaMocks.findOne,
    deleteOne: mediaMocks.deleteOne,
  },
}));

vi.mock("../src/config/env", () => ({
  env: {
    minio: {
      bucket: "test-bucket",
    },
  },
}));

vi.mock("../src/config/minio", () => ({
  minioClient: {
    removeObject: minioMocks.removeObject,
  },
  publicMinioClient: {
    presignedPutObject: minioMocks.presignedPutObject,
  },
  buildPublicObjectUrl: minioMocks.buildPublicObjectUrl,
  toBrowserMinioUrl: minioMocks.toBrowserMinioUrl,
}));

import mediaService from "../src/services/media.service";

const createMediaDocument = (overrides: Record<string, unknown> = {}) => ({
  _id: "media-id",
  objectKey: "posts/user-a/fixed-media-id.png",
  mimeType: "image/png",
  size: 1024,
  originalName: "demo.png",
  ownerId: "user-a",
  usage: "post",
  alt: "demo image",
  type: "image",
  bucket: "test-bucket",
  url: "http://cdn.test/test-bucket/posts/user-a/fixed-media-id.png",
  createdAt: new Date("2026-06-22T10:00:00.000Z"),
  updatedAt: new Date("2026-06-22T10:01:00.000Z"),
  ...overrides,
});

describe("media.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    minioMocks.presignedPutObject.mockResolvedValue(
      "http://minio.test/test-bucket/posts/user-a/fixed-media-id.png?signature=1",
    );
    minioMocks.buildPublicObjectUrl.mockReturnValue(
      "http://cdn.test/test-bucket/posts/user-a/fixed-media-id.png",
    );
    minioMocks.toBrowserMinioUrl.mockImplementation((url: string) =>
      url.replace("http://minio.test", "http://localhost:9000"),
    );
  });

  it("genere une URL presignee et sauvegarde les metadonnees", async () => {
    const result = await mediaService.generatePresignedUrl({
      filename: "demo. png",
      mimeType: "image/png",
      size: 1024,
      alt: "demo image",
      ownerId: "user-a",
      usage: "post",
    });

    expect(result).toEqual({
      uploadUrl:
        "http://localhost:9000/test-bucket/posts/user-a/fixed-media-id.png?signature=1",
      objectKey: "posts/user-a/fixed-media-id.png",
      publicUrl: "http://cdn.test/test-bucket/posts/user-a/fixed-media-id.png",
      expiresIn: 300,
    });
    expect(minioMocks.presignedPutObject).toHaveBeenCalledWith(
      "test-bucket",
      "posts/user-a/fixed-media-id.png",
      300,
    );
    expect(mediaMocks.create).toHaveBeenCalledWith({
      objectKey: "posts/user-a/fixed-media-id.png",
      mimeType: "image/png",
      size: 1024,
      originalName: "demo. png",
      ownerId: "user-a",
      usage: "post",
      alt: "demo image",
      type: "image",
      bucket: "test-bucket",
      url: "http://cdn.test/test-bucket/posts/user-a/fixed-media-id.png",
    });
  });

  it("classe les videos et fichiers generiques", async () => {
    await mediaService.generatePresignedUrl({
      filename: "clip.mp4",
      mimeType: "video/mp4",
      size: 2048,
      ownerId: "user-a",
      usage: "general",
    });

    expect(mediaMocks.create).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: "video" }),
    );

    await mediaService.generatePresignedUrl({
      filename: "document.pdf",
      mimeType: "application/pdf",
      size: 2048,
      ownerId: "user-a",
      usage: "general",
    });

    expect(mediaMocks.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        objectKey: "general/user-a/fixed-media-id.pdf",
        type: "file",
      }),
    );
  });

  it("retourne un media par objectKey", async () => {
    mediaMocks.findOne.mockResolvedValue(createMediaDocument());

    const media = await mediaService.getMediaByKey("posts/user-a/demo.png");

    expect(media.id).toBe("media-id");
    expect(media.objectKey).toBe("posts/user-a/fixed-media-id.png");
  });

  it("retourne MEDIA_NOT_FOUND si le media est absent", async () => {
    mediaMocks.findOne.mockResolvedValue(null);

    await expect(mediaService.getMediaByKey("missing.png")).rejects.toThrow(
      "MEDIA_NOT_FOUND",
    );
  });

  it("supprime le fichier et ses metadonnees", async () => {
    mediaMocks.findOne.mockResolvedValue(createMediaDocument());
    minioMocks.removeObject.mockResolvedValue(undefined);
    mediaMocks.deleteOne.mockResolvedValue({ deletedCount: 1 });

    await mediaService.deleteMedia("posts/user-a/demo.png", "user-a");

    expect(minioMocks.removeObject).toHaveBeenCalledWith(
      "test-bucket",
      "posts/user-a/demo.png",
    );
    expect(mediaMocks.deleteOne).toHaveBeenCalledWith({
      objectKey: "posts/user-a/demo.png",
    });
  });

  it("refuse la suppression par un autre proprietaire", async () => {
    mediaMocks.findOne.mockResolvedValue(createMediaDocument());

    await expect(
      mediaService.deleteMedia("posts/user-a/demo.png", "user-b"),
    ).rejects.toThrow("MEDIA_FORBIDDEN");
    expect(minioMocks.removeObject).not.toHaveBeenCalled();
  });
});
