import { buildServiceUrl } from "../config/services";
import { requestService, ServiceError } from "../utils/http-client";

export type AuthenticatedUser = {
  id: string;
  email?: string;
  role?: string;
  [key: string]: unknown;
};

type VerifyResponse = {
  data?: {
    user?: AuthenticatedUser;
  };
};

type MeResponse = {
  data?: {
    user?: AuthenticatedUser;
  };
};

type RegisterGatewayInput = {
  email?: string;
  password?: string;
};

type LoginGatewayInput = {
  email?: string;
  password?: string;
};

type RegisterGatewayResponse = {
  status: string;
  message?: string;
  data: {
    user: AuthenticatedUser;
  };
};

type LoginGatewayResponse = {
  status: string;
  message?: string;
  data?: {
    user?: AuthenticatedUser;
    accessToken?: string;
    refreshToken?: string;
  };
};

const buildAuthHeaders = (authorization: string, requestId?: string | undefined) => ({
  Authorization: authorization,
  ...(requestId ? { "x-request-id": requestId } : {}),
});

export const verifyAccessToken = async (authorization: string, requestId?: string) => {
  const response = await requestService<VerifyResponse>("auth", {
    method: "GET",
    url: buildServiceUrl("auth", "/verify"),
    headers: buildAuthHeaders(authorization, requestId),
  });

  const user = response.data.data?.user;

  if (!user?.id) {
    throw new ServiceError("auth", 502, "Invalid response from auth-service", {
      status: "error",
      message: "Invalid response from auth-service",
    });
  }

  return user;
};

export const getAuthenticatedUserDetails = async (
  authorization: string,
  requestId?: string,
) => {
  const response = await requestService<MeResponse>("auth", {
    method: "GET",
    url: buildServiceUrl("auth", "/me"),
    headers: buildAuthHeaders(authorization, requestId),
  });

  const user = response.data.data?.user;

  if (!user?.id) {
    throw new ServiceError("auth", 502, "Invalid response from auth-service", {
      status: "error",
      message: "Invalid response from auth-service",
    });
  }

  return user;
};

export const registerAuthUser = async (
  payload: RegisterGatewayInput,
  requestId?: string,
) => {
  const response = await requestService<RegisterGatewayResponse>("auth", {
    method: "POST",
    url: buildServiceUrl("auth", "/register"),
    headers: {
      "Content-Type": "application/json",
      ...(requestId ? { "x-request-id": requestId } : {}),
    },
    data: payload,
  });

  const user = response.data.data?.user;

  if (!user?.id) {
    throw new ServiceError("auth", 502, "Invalid response from auth-service", {
      status: "error",
      message: "Invalid response from auth-service",
    });
  }

  return response.data;
};

export const loginAuthUser = async (
  payload: LoginGatewayInput,
  requestId?: string,
) => {
  const response = await requestService<LoginGatewayResponse>("auth", {
    method: "POST",
    url: buildServiceUrl("auth", "/login"),
    headers: {
      "Content-Type": "application/json",
      ...(requestId ? { "x-request-id": requestId } : {}),
    },
    data: payload,
  });

  const user = response.data.data?.user;
  const accessToken = response.data.data?.accessToken;
  const refreshToken = response.data.data?.refreshToken;

  if (!user?.id || !accessToken || !refreshToken) {
    throw new ServiceError("auth", 502, "Invalid response from auth-service", {
      status: "error",
      message: "Invalid response from auth-service",
    });
  }

  return {
    ...response.data,
    data: {
      user,
      accessToken,
      refreshToken,
    },
  };
};

export const logoutAuthUser = async (
  authorization: string,
  refreshToken: string,
  requestId?: string,
) => {
  await requestService("auth", {
    method: "POST",
    url: buildServiceUrl("auth", "/logout"),
    headers: {
      "Content-Type": "application/json",
      ...buildAuthHeaders(authorization, requestId),
    },
    data: {
      refreshToken,
    },
  });
};
