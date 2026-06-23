import { buildServiceUrl } from "../config/services";
import { requestService } from "../utils/http-client";

export const USER_ROLES = ["USER", "MODERATOR", "ADMIN"] as const;
export const USER_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];

type UserServiceResponse = {
  data?: UserState | null;
};

export type UserState = {
  id_user?: string;
  role?: unknown;
  statuts?: unknown;
  [key: string]: unknown;
};

export const isUserRole = (value: unknown): value is UserRole =>
  typeof value === "string" && USER_ROLES.includes(value as UserRole);

export const isUserStatus = (value: unknown): value is UserStatus =>
  typeof value === "string" && USER_STATUSES.includes(value as UserStatus);

export const getUserStateByUserId = async (
  userId: string,
  authorization?: string,
  requestId?: string,
) => {
  const response = await requestService<UserServiceResponse>("users", {
    method: "GET",
    url: buildServiceUrl("users", `/${encodeURIComponent(userId)}`),
    headers: {
      ...(authorization ? { Authorization: authorization } : {}),
      ...(requestId ? { "x-request-id": requestId } : {}),
    },
  });

  return response.data.data ?? null;
};

export const getCurrentUserRole = async (
  userId: string,
  authorization: string,
  requestId?: string,
) => {
  const userState = await getUserStateByUserId(userId, authorization, requestId);

  return isUserRole(userState?.role) ? userState.role : null;
};
