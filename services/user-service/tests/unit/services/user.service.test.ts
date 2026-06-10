import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("../../../src/config/prisma", () => ({
  prisma: {
    user_state: prismaMocks,
  },
}));

import {
  createUserState,
  deleteUserState,
  getUserStateById,
  HttpError,
  updateUserState,
} from "../../../src/services/user.service";

describe("user.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getUserStateById returns the matching user state", async () => {
    prismaMocks.findUnique.mockResolvedValue({
      id_user: "user-42",
      role: "USER",
      statuts: "ACTIVE",
    });

    const result = await getUserStateById("user-42");

    expect(prismaMocks.findUnique).toHaveBeenCalledWith({
      where: { id_user: "user-42" },
      select: {
        id_user: true,
        role: true,
        statuts: true,
      },
    });
    expect(result).toEqual({
      id_user: "user-42",
      role: "USER",
      statuts: "ACTIVE",
    });
  });

  it("getUserStateById throws HttpError when the user state does not exist", async () => {
    prismaMocks.findUnique.mockResolvedValue(null);

    await expect(getUserStateById("missing")).rejects.toMatchObject({
      name: "HttpError",
      statusCode: 404,
      message: "User state not found",
    });
  });

  it("createUserState persists the user state and returns it", async () => {
    const payload = {
      id_user: "user-1",
      role: "ADMIN" as const,
      statuts: "ACTIVE" as const,
    };

    prismaMocks.create.mockResolvedValue(payload);

    const result = await createUserState(payload);

    expect(prismaMocks.create).toHaveBeenCalledWith({
      data: payload,
      select: {
        id_user: true,
        role: true,
        statuts: true,
      },
    });
    expect(result).toEqual(payload);
  });

  it("createUserState maps Prisma duplicate errors to HttpError", async () => {
    prismaMocks.create.mockRejectedValue({ code: "P2002" });

    await expect(
      createUserState({
        id_user: "user-1",
        role: "ADMIN",
        statuts: "ACTIVE",
      }),
    ).rejects.toMatchObject({
      name: "HttpError",
      statusCode: 409,
      message: "User state already exists",
    });
  });

  it("updateUserState updates and returns the user state", async () => {
    prismaMocks.update.mockResolvedValue({
      id_user: "user-42",
      role: "MODERATOR",
      statuts: "ACTIVE",
    });

    const result = await updateUserState("user-42", {
      role: "MODERATOR",
    });

    expect(prismaMocks.update).toHaveBeenCalledWith({
      where: { id_user: "user-42" },
      data: { role: "MODERATOR" },
      select: {
        id_user: true,
        role: true,
        statuts: true,
      },
    });
    expect(result).toEqual({
      id_user: "user-42",
      role: "MODERATOR",
      statuts: "ACTIVE",
    });
  });

  it("updateUserState maps missing rows to HttpError", async () => {
    prismaMocks.update.mockRejectedValue({ code: "P2025" });

    await expect(
      updateUserState("missing", {
        statuts: "INACTIVE",
      }),
    ).rejects.toMatchObject({
      name: "HttpError",
      statusCode: 404,
      message: "User state not found",
    });
  });

  it("deleteUserState deletes the user state", async () => {
    prismaMocks.delete.mockResolvedValue(undefined);

    await deleteUserState("user-42");

    expect(prismaMocks.delete).toHaveBeenCalledWith({
      where: { id_user: "user-42" },
    });
  });

  it("deleteUserState maps missing rows to HttpError", async () => {
    prismaMocks.delete.mockRejectedValue({ code: "P2025" });

    await expect(deleteUserState("missing")).rejects.toMatchObject({
      name: "HttpError",
      statusCode: 404,
      message: "User state not found",
    });
  });

  it("HttpError exposes its status code", () => {
    const error = new HttpError(409, "conflict");

    expect(error).toMatchObject({
      name: "HttpError",
      statusCode: 409,
      message: "conflict",
    });
  });
});
