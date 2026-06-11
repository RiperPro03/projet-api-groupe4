import { httpClient } from "./http-client";

export type AuthResponse = {
  status: string;
  message?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
  };
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = LoginPayload & {
  username: string;
};

export async function login(payload: LoginPayload) {
  const { data } = await httpClient.post<AuthResponse>("/auth/login", payload);

  return data;
}

export async function register(payload: RegisterPayload) {
  const { data } = await httpClient.post<AuthResponse>("/auth/register", payload);

  return data;
}

export async function verify() {
  const { data } = await httpClient.get("/auth/verify");

  return data;
}

export async function refreshToken(refreshToken: string) {
  const { data } = await httpClient.post<AuthResponse>("/auth/refresh-token", {
    refreshToken,
  });

  return data;
}

export const authService = {
  login,
  register,
  verify,
  refreshToken,
};
