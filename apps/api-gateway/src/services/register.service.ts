import { buildServiceUrl } from "../config/services";
import { requestService, ServiceError } from "../utils/http-client";

type RegisterGatewayInput = {
  email?: string;
  password?: string;
  username: string;
  nickname?: string;
  bio?: string;
  bibliography?: string;
  url_photo?: string;
};

type RegisteredUser = {
  id: string;
  email?: string;
  [key: string]: unknown;
};

type AuthRegisterResponse = {
  status: string;
  message?: string;
  data?: {
    user?: RegisteredUser;
  };
};

export const registerUserWithDefaults = async (
  payload: RegisterGatewayInput,
  requestId?: string,
) => {
  const authResponse = await requestService<AuthRegisterResponse>("auth", {
    method: "POST",
    url: buildServiceUrl("auth", "/register"),
    headers: {
      "Content-Type": "application/json",
      ...(requestId ? { "x-request-id": requestId } : {}),
    },
    data: {
      email: payload.email,
      password: payload.password,
    },
  });

  const user = authResponse.data.data?.user;

  if (!user?.id) {
    throw new ServiceError("auth", 502, "Invalid response from auth-service", {
      status: "error",
      message: "Invalid response from auth-service",
    });
  }

  await requestService("profiles", {
    method: "POST",
    url: buildServiceUrl("profiles", "/"),
    headers: {
      "Content-Type": "application/json",
      ...(requestId ? { "x-request-id": requestId } : {}),
    },
    data: {
      id_user: user.id,
      username: payload.username,
      nickname: payload.nickname,
      bio: payload.bio,
      bibliography: payload.bibliography,
      url_photo: payload.url_photo,
    },
  });

  await requestService("users", {
    method: "POST",
    url: buildServiceUrl("users", "/"),
    headers: {
      "Content-Type": "application/json",
      ...(requestId ? { "x-request-id": requestId } : {}),
    },
    data: {
      id_user: user.id,
      role: "USER",
      statuts: "ACTIVE",
    },
  });

  return authResponse.data;
};
