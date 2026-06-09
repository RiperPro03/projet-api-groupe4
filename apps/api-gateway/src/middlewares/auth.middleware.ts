import axios, { type AxiosError } from "axios";
import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env";

type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
};

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

type VerifyResponse = {
  status?: string;
  message?: string;
  data?: {
    user?: AuthenticatedUser;
  };
};

const VERIFY_URL = `${env.AUTH_SERVICE_URL}/auth/verify`;
const AUTH_TIMEOUT_MS = 5000;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getBearerToken = (authorization: string | undefined) => {
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();

  return token.length > 0 ? token : null;
};

const buildErrorPayload = (statusCode: number, fallbackMessage: string) => ({
  status: "error",
  message: fallbackMessage,
  statusCode,
});

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.method === "OPTIONS") {
    next();
    return;
  }

  const authorization = req.header("authorization");
  const token = getBearerToken(authorization);

  if (!token || !authorization) {
    res.status(401).json({
      status: "error",
      message: "Missing or invalid authorization header",
    });
    return;
  }

  try {
    const { data } = await axios.get<VerifyResponse>(VERIFY_URL, {
      headers: {
        authorization,
        "x-request-id": req.header("x-request-id") ?? "",
      },
      timeout: AUTH_TIMEOUT_MS,
    });

    if (data.data?.user) {
      req.user = data.data.user;
    }

    next();
  } catch (error) {
    const axiosError = error as AxiosError<VerifyResponse>;

    if (axiosError.response) {
      const { status, data } = axiosError.response;

      if (isObject(data)) {
        res.status(status).json(data);
        return;
      }

      res
        .status(status)
        .json(buildErrorPayload(status, "Authentication failed"));
      return;
    }

    res.status(503).json({
      status: "error",
      message: "Auth service unavailable",
    });
  }
};

export default authMiddleware;
