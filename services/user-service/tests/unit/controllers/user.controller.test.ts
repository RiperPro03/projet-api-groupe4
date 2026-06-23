import type { Request } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  CreateUserStateInput,
  UpdateUserStateInput,
  UserStateParams,
  UserStateRoleParams,
} from "../../../src/models/user.model";
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
    createUserState: vi.fn(),
    getUserStateById: vi.fn(),
    getUserStatesByRole: vi.fn(),
    updateUserState: vi.fn(),
    deleteUserState: vi.fn(),
  };
});

vi.mock("../../../src/services/user.service", () => serviceMocks);

import {
  createUserStateController,
  deleteUserStateController,
  getUserStateByIdController,
  getUserStatesByRoleController,
  updateUserStateController,
} from "../../../src/controllers/user.controller";

type CreateUserStateRequest = Request<
  Record<string, never>,
  unknown,
  CreateUserStateInput
>;
type GetUserStateRequest = Request<UserStateParams>;
type GetUserStatesByRoleRequest = Request<UserStateRoleParams>;
type UpdateUserStateRequest = Request<
  UserStateParams,
  unknown,
  UpdateUserStateInput
>;

describe("user.controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createUserStateController returns 201 with the created user state", async () => {
    const req = {
      body: {
        id_user: "user-1",
        role: "ADMIN",
        statuts: "ACTIVE",
      },
    } as CreateUserStateRequest;
    const res = createMockResponse();

    serviceMocks.createUserState.mockResolvedValue({
      id_user: "user-1",
      role: "ADMIN",
      statuts: "ACTIVE",
    });

    await createUserStateController(req, res, vi.fn());

    expect(serviceMocks.createUserState).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "User state created successfully",
      data: {
        id_user: "user-1",
        role: "ADMIN",
        statuts: "ACTIVE",
      },
    });
  });

  it("getUserStateByIdController returns 200 with the requested user state", async () => {
    const req = {
      params: {
        id_user: "user-42",
      },
    } as GetUserStateRequest;
    const res = createMockResponse();

    serviceMocks.getUserStateById.mockResolvedValue({
      id_user: "user-42",
      role: "USER",
      statuts: "ACTIVE",
    });

    await getUserStateByIdController(req, res, vi.fn());

    expect(serviceMocks.getUserStateById).toHaveBeenCalledWith("user-42");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "User state retrieved successfully",
      data: {
        id_user: "user-42",
        role: "USER",
        statuts: "ACTIVE",
      },
    });
  });

  it("getUserStatesByRoleController returns 200 with active users", async () => {
    const req = {
      params: {
        role: "MODERATOR",
      },
    } as GetUserStatesByRoleRequest;
    const res = createMockResponse();

    serviceMocks.getUserStatesByRole.mockResolvedValue([
      {
        id_user: "mod-1",
        role: "MODERATOR",
        statuts: "ACTIVE",
      },
    ]);

    await getUserStatesByRoleController(req, res, vi.fn());

    expect(serviceMocks.getUserStatesByRole).toHaveBeenCalledWith("MODERATOR");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "User states retrieved successfully",
      data: {
        users: [
          {
            id_user: "mod-1",
            role: "MODERATOR",
            statuts: "ACTIVE",
          },
        ],
      },
    });
  });

  it("updateUserStateController returns 200 with the updated user state", async () => {
    const req = {
      params: {
        id_user: "user-42",
      },
      body: {
        statuts: "INACTIVE",
      },
    } as UpdateUserStateRequest;
    const res = createMockResponse();

    serviceMocks.updateUserState.mockResolvedValue({
      id_user: "user-42",
      role: "USER",
      statuts: "INACTIVE",
    });

    await updateUserStateController(req, res, vi.fn());

    expect(serviceMocks.updateUserState).toHaveBeenCalledWith("user-42", {
      statuts: "INACTIVE",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "User state updated successfully",
      data: {
        id_user: "user-42",
        role: "USER",
        statuts: "INACTIVE",
      },
    });
  });

  it("deleteUserStateController returns 200 after deletion", async () => {
    const req = {
      params: {
        id_user: "user-42",
      },
    } as GetUserStateRequest;
    const res = createMockResponse();

    serviceMocks.deleteUserState.mockResolvedValue(undefined);

    await deleteUserStateController(req, res, vi.fn());

    expect(serviceMocks.deleteUserState).toHaveBeenCalledWith("user-42");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "User state deleted successfully",
    });
  });

  it("maps HttpError instances to their status code and message", async () => {
    const req = {
      params: {
        id_user: "missing",
      },
    } as GetUserStateRequest;
    const res = createMockResponse();

    serviceMocks.getUserStateById.mockRejectedValue(
      new serviceMocks.HttpError(404, "User state not found"),
    );

    await getUserStateByIdController(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "User state not found",
    });
  });

  it("returns 500 for unexpected service errors", async () => {
    const req = {
      body: {
        id_user: "user-1",
      },
    } as CreateUserStateRequest;
    const res = createMockResponse();
    const error = new Error("unexpected");

    vi.spyOn(console, "error").mockImplementation(() => undefined);
    serviceMocks.createUserState.mockRejectedValue(error);

    await createUserStateController(req, res, vi.fn());

    expect(console.error).toHaveBeenCalledWith(error);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Internal server error",
    });
  });
});
