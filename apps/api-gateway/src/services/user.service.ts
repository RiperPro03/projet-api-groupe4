import { buildServiceUrl } from "../config/services";
import { requestService } from "../utils/http-client";

export const USER_ROLES = ["USER", "MODERATOR", "ADMIN"] as const;

export type UserRole = (typeof USER_ROLES)[number];

type UserServiceResponse = {
  data?: Record<string, unknown> | null;
};

export const isUserRole = (value: unknown): value is UserRole =>
  typeof value === "string" && USER_ROLES.includes(value as UserRole);

export const getUserStateByUserId = async (
  userId: string,
  authorization: string,
  requestId?: string,
) => {
  const response = await requestService<UserServiceResponse>("users", {
    method: "GET",
    url: buildServiceUrl("users", `/${encodeURIComponent(userId)}`),
    headers: {
      Authorization: authorization,
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
