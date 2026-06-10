export const USER_STATE_ROLES = ["ADMIN", "MODERATOR", "USER"] as const;
export const USER_STATE_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export type UserStateRole = (typeof USER_STATE_ROLES)[number];
export type UserStateStatus = (typeof USER_STATE_STATUSES)[number];

export interface UserState {
  id_user: string;
  role: UserStateRole;
  statuts: UserStateStatus;
}

export interface CreateUserStateInput {
  id_user: string;
  role?: UserStateRole;
  statuts?: UserStateStatus;
}

export interface UpdateUserStateInput {
  role?: UserStateRole;
  statuts?: UserStateStatus;
}

export interface UserStateParams {
  [key: string]: string;
  id_user: string;
}
