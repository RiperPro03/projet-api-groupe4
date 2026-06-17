import { UserInfo, type CreateProfileInput, type UpdateProfileInput } from "../models/user-info.model";
import { AppError } from "../middlewares/error.middleware";

export const createProfile = async (payload: CreateProfileInput) => {
  const profile = await UserInfo.create(payload);
  return profile.toJSON();
};

export const getProfiles = async () => {
  const profiles = await UserInfo.find().sort({ createdAt: -1 });
  return profiles.map((profile) => profile.toJSON());
};

export const getProfileById = async (id_user: string) => {
  const profile = await UserInfo.findOne({ id_user });

  if (!profile) {
    throw new AppError(404, "Profile not found");
  }

  return profile.toJSON();
};

export const getProfileByUsername = async (username: string) => {
  const profile = await UserInfo.findOne({ username });

  if (!profile) {
    throw new AppError(404, "Profile not found");
  }

  return profile.toJSON();
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const searchProfilesByUsername = async (username: string) => {
  const profiles = await UserInfo.find({
    username: { $regex: escapeRegex(username), $options: "i" },
  })
    .sort({ username: 1 })
    .limit(10);

  return profiles.map((profile) => profile.toJSON());
};

export const updateProfile = async (
  id_user: string,
  payload: UpdateProfileInput,
) => {
  const profile = await UserInfo.findOneAndUpdate(
    { id_user },
    payload,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!profile) {
    throw new AppError(404, "Profile not found");
  }

  return profile.toJSON();
};

export const deleteProfile = async (id_user: string) => {
  const profile = await UserInfo.findOneAndDelete({ id_user });

  if (!profile) {
    throw new AppError(404, "Profile not found");
  }

  return profile.toJSON();
};
