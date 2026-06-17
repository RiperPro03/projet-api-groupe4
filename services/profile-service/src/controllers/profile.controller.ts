import type { RequestHandler } from "express";

import {
  createProfileSchema,
  profileParamsSchema,
  profileSearchQuerySchema,
  profileUsernameParamsSchema,
  updateProfileSchema,
} from "../models/user-info.model";
import {
  createProfile,
  deleteProfile,
  getProfileById,
  getProfileByUsername,
  getProfiles,
  searchProfilesByUsername,
  updateProfile,
} from "../services/profile.service";

export const createProfileController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const payload = createProfileSchema.parse(req.body);
    const profile = await createProfile(payload);

    return res.status(201).json({
      status: "success",
      message: "Profile created successfully",
      data: profile,
    });
  } catch (error) {
    return next(error);
  }
};

export const getProfilesController: RequestHandler = async (
  _req,
  res,
  next,
) => {
  try {
    const profiles = await getProfiles();

    return res.status(200).json({
      status: "success",
      data: profiles,
    });
  } catch (error) {
    return next(error);
  }
};

export const getProfileByIdController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { id_user } = profileParamsSchema.parse(req.params);
    const profile = await getProfileById(id_user);

    return res.status(200).json({
      status: "success",
      data: profile,
    });
  } catch (error) {
    return next(error);
  }
};

export const getProfileByUsernameController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { username } = profileUsernameParamsSchema.parse(req.params);
    const profile = await getProfileByUsername(username);

    return res.status(200).json({
      status: "success",
      data: profile,
    });
  } catch (error) {
    return next(error);
  }
};

export const searchProfilesByUsernameController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { username } = profileSearchQuerySchema.parse(req.query);
    const profiles = await searchProfilesByUsername(username);

    return res.status(200).json({
      status: "success",
      data: profiles,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateProfileController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { id_user } = profileParamsSchema.parse(req.params);
    const payload = updateProfileSchema.parse(req.body);
    const profile = await updateProfile(id_user, payload);

    return res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: profile,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteProfileController: RequestHandler = async (
  req,
  res,
  next,
) => {
  try {
    const { id_user } = profileParamsSchema.parse(req.params);
    const profile = await deleteProfile(id_user);

    return res.status(200).json({
      status: "success",
      message: "Profile deleted successfully",
      data: profile,
    });
  } catch (error) {
    return next(error);
  }
};
