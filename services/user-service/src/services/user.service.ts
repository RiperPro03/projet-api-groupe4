import { prisma } from "../config/prisma";
import type {
  CreateUserStateInput,
  UpdateUserStateInput,
  UserState,
} from "../models/user.model";

const userStateSelect = {
  id_user: true,
  role: true,
  statuts: true,
} as const;

type PrismaErrorWithCode = {
  code?: string;
};

const isPrismaErrorWithCode = (
  error: unknown,
  expectedCode: string,
): error is PrismaErrorWithCode =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as PrismaErrorWithCode).code === expectedCode;

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const getUserStateById = async (
  id_user: string,
): Promise<UserState | null> => {
  const userState = await prisma.user_state.findUnique({
    where: { id_user },
    select: userStateSelect,
  });

  if (!userState) {
    throw new HttpError(404, "User state not found");
  }

  return userState;
};

export const createUserState = async (
  data: CreateUserStateInput,
): Promise<UserState> => {
  try {
    return await prisma.user_state.create({
      data,
      select: userStateSelect,
    });
  } catch (error) {
    if (isPrismaErrorWithCode(error, "P2002")) {
      throw new HttpError(409, "User state already exists");
    }

    throw error;
  }
};

export const updateUserState = async (
  id_user: string,
  data: UpdateUserStateInput,
): Promise<UserState> => {
  try {
    return await prisma.user_state.update({
      where: { id_user },
      data,
      select: userStateSelect,
    });
  } catch (error) {
    if (isPrismaErrorWithCode(error, "P2025")) {
      throw new HttpError(404, "User state not found");
    }

    throw error;
  }
};

export const deleteUserState = async (id_user: string): Promise<void> => {
  try {
    await prisma.user_state.delete({
      where: { id_user },
    });
  } catch (error) {
    if (isPrismaErrorWithCode(error, "P2025")) {
      throw new HttpError(404, "User state not found");
    }

    throw error;
  }
};
