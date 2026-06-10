import { beforeEach, describe, expect, it, vi } from "vitest";

const modelMocks = vi.hoisted(() => ({
  create: vi.fn(),
  find: vi.fn(),
  sort: vi.fn(),
  findOne: vi.fn(),
  findOneAndUpdate: vi.fn(),
  findOneAndDelete: vi.fn(),
}));

vi.mock("../../../src/models/user-info.model", () => ({
  UserInfo: {
    create: modelMocks.create,
    find: modelMocks.find,
    findOne: modelMocks.findOne,
    findOneAndUpdate: modelMocks.findOneAndUpdate,
    findOneAndDelete: modelMocks.findOneAndDelete,
  },
}));

import { AppError } from "../../../src/middlewares/error.middleware";
import {
  createProfile,
  deleteProfile,
  getProfileById,
  getProfiles,
  updateProfile,
} from "../../../src/services/profile.service";

describe("profile.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    modelMocks.find.mockReturnValue({
      sort: modelMocks.sort,
    });
  });

  it("createProfile persists the profile and returns its JSON shape", async () => {
    const payload = {
      id_user: "user-1",
      username: "alice",
      nickname: "",
      bio: "",
      url_photo: "",
    };
    const savedProfile = {
      toJSON: vi.fn(() => ({
        id_user: "user-1",
        username: "alice",
      })),
    };

    modelMocks.create.mockResolvedValue(savedProfile);

    const result = await createProfile(payload);

    expect(modelMocks.create).toHaveBeenCalledWith(payload);
    expect(savedProfile.toJSON).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      id_user: "user-1",
      username: "alice",
    });
  });

  it("getProfiles sorts profiles by creation date descending", async () => {
    const firstProfile = {
      toJSON: vi.fn(() => ({ id_user: "user-2" })),
    };
    const secondProfile = {
      toJSON: vi.fn(() => ({ id_user: "user-1" })),
    };

    modelMocks.sort.mockResolvedValue([firstProfile, secondProfile]);

    const result = await getProfiles();

    expect(modelMocks.find).toHaveBeenCalledTimes(1);
    expect(modelMocks.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(result).toEqual([{ id_user: "user-2" }, { id_user: "user-1" }]);
  });

  it("getProfileById returns the matching profile", async () => {
    const profile = {
      toJSON: vi.fn(() => ({ id_user: "user-42" })),
    };

    modelMocks.findOne.mockResolvedValue(profile);

    const result = await getProfileById("user-42");

    expect(modelMocks.findOne).toHaveBeenCalledWith({ id_user: "user-42" });
    expect(result).toEqual({ id_user: "user-42" });
  });

  it("getProfileById throws AppError when the profile does not exist", async () => {
    modelMocks.findOne.mockResolvedValue(null);

    await expect(getProfileById("missing")).rejects.toMatchObject({
      name: "AppError",
      statusCode: 404,
      message: "Profile not found",
    });
  });

  it("updateProfile updates the profile with validator options", async () => {
    const updatedProfile = {
      toJSON: vi.fn(() => ({ id_user: "user-42", nickname: "ally" })),
    };

    modelMocks.findOneAndUpdate.mockResolvedValue(updatedProfile);

    const result = await updateProfile("user-42", {
      username: undefined,
      nickname: "ally",
      bio: undefined,
      url_photo: undefined,
    });

    expect(modelMocks.findOneAndUpdate).toHaveBeenCalledWith(
      { id_user: "user-42" },
      {
        username: undefined,
        nickname: "ally",
        bio: undefined,
        url_photo: undefined,
      },
      {
        new: true,
        runValidators: true,
      },
    );
    expect(result).toEqual({ id_user: "user-42", nickname: "ally" });
  });

  it("updateProfile throws AppError when the profile does not exist", async () => {
    modelMocks.findOneAndUpdate.mockResolvedValue(null);

    await expect(
      updateProfile("missing", {
        username: undefined,
        nickname: "ally",
        bio: undefined,
        url_photo: undefined,
      }),
    ).rejects
      .toMatchObject({
        name: "AppError",
        statusCode: 404,
        message: "Profile not found",
      });
  });

  it("deleteProfile removes the profile and returns its JSON shape", async () => {
    const deletedProfile = {
      toJSON: vi.fn(() => ({ id_user: "user-42" })),
    };

    modelMocks.findOneAndDelete.mockResolvedValue(deletedProfile);

    const result = await deleteProfile("user-42");

    expect(modelMocks.findOneAndDelete).toHaveBeenCalledWith({
      id_user: "user-42",
    });
    expect(result).toEqual({ id_user: "user-42" });
  });

  it("deleteProfile throws AppError when the profile does not exist", async () => {
    modelMocks.findOneAndDelete.mockResolvedValue(null);

    await expect(deleteProfile("missing")).rejects.toMatchObject({
      name: "AppError",
      statusCode: 404,
      message: "Profile not found",
    });
  });
});
