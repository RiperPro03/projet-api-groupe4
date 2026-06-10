import type { NextFunction, Request } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockResponse } from "../../utils/mock-response";

const schemaMocks = vi.hoisted(() => ({
  createProfileSchema: {
    parse: vi.fn((value) => value),
  },
  updateProfileSchema: {
    parse: vi.fn((value) => value),
  },
  profileParamsSchema: {
    parse: vi.fn((value) => value),
  },
}));

const serviceMocks = vi.hoisted(() => ({
  createProfile: vi.fn(),
  getProfiles: vi.fn(),
  getProfileById: vi.fn(),
  updateProfile: vi.fn(),
  deleteProfile: vi.fn(),
}));

vi.mock("../../../src/models/user-info.model", () => schemaMocks);
vi.mock("../../../src/services/profile.service", () => serviceMocks);

import {
  createProfileController,
  deleteProfileController,
  getProfileByIdController,
  getProfilesController,
  updateProfileController,
} from "../../../src/controllers/profile.controller";

describe("profile.controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createProfileController returns 201 with the created profile", async () => {
    const req = {
      body: {
        id_user: "user-1",
        username: "alice",
      },
    } as Request;
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    serviceMocks.createProfile.mockResolvedValue({
      id_user: "user-1",
      username: "alice",
    });

    await createProfileController(req, res, next);

    expect(schemaMocks.createProfileSchema.parse).toHaveBeenCalledWith(req.body);
    expect(serviceMocks.createProfile).toHaveBeenCalledWith(req.body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Profile created successfully",
      data: {
        id_user: "user-1",
        username: "alice",
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("createProfileController forwards schema errors to next", async () => {
    const req = { body: {} } as Request;
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;
    const error = new Error("invalid payload");

    schemaMocks.createProfileSchema.parse.mockImplementationOnce(() => {
      throw error;
    });

    await createProfileController(req, res, next);

    expect(serviceMocks.createProfile).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(error);
  });

  it("getProfilesController returns 200 with the profile list", async () => {
    const req = {} as Request;
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    serviceMocks.getProfiles.mockResolvedValue([{ id_user: "user-1" }]);

    await getProfilesController(req, res, next);

    expect(serviceMocks.getProfiles).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      data: [{ id_user: "user-1" }],
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("getProfileByIdController validates params and returns the profile", async () => {
    const req = {
      params: {
        id_user: "user-42",
      },
    } as unknown as Request;
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    serviceMocks.getProfileById.mockResolvedValue({ id_user: "user-42" });

    await getProfileByIdController(req, res, next);

    expect(schemaMocks.profileParamsSchema.parse).toHaveBeenCalledWith(req.params);
    expect(serviceMocks.getProfileById).toHaveBeenCalledWith("user-42");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      data: { id_user: "user-42" },
    });
  });

  it("updateProfileController validates params and body before updating", async () => {
    const req = {
      params: {
        id_user: "user-42",
      },
      body: {
        nickname: "ally",
      },
    } as unknown as Request;
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    serviceMocks.updateProfile.mockResolvedValue({
      id_user: "user-42",
      nickname: "ally",
    });

    await updateProfileController(req, res, next);

    expect(schemaMocks.profileParamsSchema.parse).toHaveBeenCalledWith(req.params);
    expect(schemaMocks.updateProfileSchema.parse).toHaveBeenCalledWith(req.body);
    expect(serviceMocks.updateProfile).toHaveBeenCalledWith("user-42", {
      nickname: "ally",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Profile updated successfully",
      data: {
        id_user: "user-42",
        nickname: "ally",
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("updateProfileController forwards service errors to next", async () => {
    const req = {
      params: {
        id_user: "user-42",
      },
      body: {
        nickname: "ally",
      },
    } as unknown as Request;
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;
    const error = new Error("Profile not found");

    serviceMocks.updateProfile.mockRejectedValue(error);

    await updateProfileController(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("deleteProfileController validates params and returns the deleted profile", async () => {
    const req = {
      params: {
        id_user: "user-42",
      },
    } as unknown as Request;
    const res = createMockResponse();
    const next = vi.fn() as NextFunction;

    serviceMocks.deleteProfile.mockResolvedValue({ id_user: "user-42" });

    await deleteProfileController(req, res, next);

    expect(schemaMocks.profileParamsSchema.parse).toHaveBeenCalledWith(req.params);
    expect(serviceMocks.deleteProfile).toHaveBeenCalledWith("user-42");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Profile deleted successfully",
      data: { id_user: "user-42" },
    });
    expect(next).not.toHaveBeenCalled();
  });
});
