import { httpClient, isApiStatusCode } from "./http-client";

// User-state constants and types
export const USER_STATE_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export const USER_STATE_ROLES = ["ADMIN", "MODERATOR", "USER"] as const;

export type UserStateStatus = (typeof USER_STATE_STATUSES)[number];
export type UserStateRole = (typeof USER_STATE_ROLES)[number];

export type UserState = {
  id_user: string;
  role: UserStateRole;
  statuts: UserStateStatus;
};

type UserStateResponse = {
  status: string;
  data: UserState;
};

// User-state reads
export async function getUserStateById(
  userId: string
): Promise<UserState | null> {
  try {
    const { data } = await httpClient.get<UserStateResponse>(
      `/users/${encodeURIComponent(userId)}`
    );

    return data.data ?? null;
  } catch (error) {
    if (isApiStatusCode(error, 404)) {
      return null;
    }

    throw error;
  }
}

// User-state mutations
export async function updateUserStatus(
  userId: string,
  statuts: UserStateStatus
): Promise<UserState> {
  const { data } = await httpClient.put<UserStateResponse>(
    `/users/${encodeURIComponent(userId)}`,
    { statuts }
  );

  return data.data;
}

export async function updateUserRole(
  userId: string,
  role: UserStateRole
): Promise<UserState> {
  const { data } = await httpClient.put<UserStateResponse>(
    `/users/${encodeURIComponent(userId)}`,
    { role }
  );

  return data.data;
}
