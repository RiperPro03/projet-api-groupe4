import type { RequestHandler, Response } from "express";

import type {
  CreateUserStateInput,
  UpdateUserStateInput,
  UserStateParams,
  UserStateRoleParams,
} from "../models/user.model";
import {
  createUserState,
  deleteUserState,
  getUserStateById,
  getUserStatesByRole,
  HttpError,
  updateUserState,
} from "../services/user.service";

const handleControllerError = (res: Response, error: unknown) => {
  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      status: "error",
      message: error.message,
    });
  }

  console.error(error);

  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};

export const createUserStateController: RequestHandler<
  Record<string, never>,
  unknown,
  CreateUserStateInput
> = async (req, res) => {
  try {
    const userState = await createUserState(req.body);

    res.status(201).json({
      status: "success",
      message: "User state created successfully",
      data: userState,
    });
  } catch (error) {
    handleControllerError(res, error);
  }
};

export const getUserStateByIdController: RequestHandler<UserStateParams> = async (
  req,
  res,
) => {
  try {
    const userState = await getUserStateById(req.params.id_user);

    res.status(200).json({
      status: "success",
      message: "User state retrieved successfully",
      data: userState,
    });
  } catch (error) {
    handleControllerError(res, error);
  }
};

export const getUserStatesByRoleController: RequestHandler<
  UserStateRoleParams
> = async (req, res) => {
  try {
    const users = await getUserStatesByRole(req.params.role);

    res.status(200).json({
      status: "success",
      message: "User states retrieved successfully",
      data: { users },
    });
  } catch (error) {
    handleControllerError(res, error);
  }
};

export const updateUserStateController: RequestHandler<
  UserStateParams,
  unknown,
  UpdateUserStateInput
> = async (req, res) => {
  try {
    const userState = await updateUserState(req.params.id_user, req.body);

    res.status(200).json({
      status: "success",
      message: "User state updated successfully",
      data: userState,
    });
  } catch (error) {
    handleControllerError(res, error);
  }
};

export const deleteUserStateController: RequestHandler<UserStateParams> = async (
  req,
  res,
) => {
  try {
    await deleteUserState(req.params.id_user);

    res.status(200).json({
      status: "success",
      message: "User state deleted successfully",
    });
  } catch (error) {
    handleControllerError(res, error);
  }
};
