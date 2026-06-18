import { Router } from "express";
import type { NextFunction, Request, Response } from "express";

import { registerController } from "../controllers/register.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { buildServiceUrl } from "../config/services";
import { createForwardHandler, requestService } from "../utils/http-client";

const router = Router();
const forwardAuthRequest = createForwardHandler("auth");
const TOKEN_COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

type AuthTokenResponse = {
  data?: {
    accessToken?: string;
    refreshToken?: string;
  };
};

const getCookieValue = (cookieHeader: string | undefined, key: string) => {
  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${key}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(key.length + 1));
};

const setTokenCookie = (res: Response, key: string, value: string, secure: boolean) => {
  res.cookie(key, value, {
    httpOnly: true,
    maxAge: TOKEN_COOKIE_MAX_AGE_MS,
    path: "/",
    sameSite: "lax",
    secure,
  });
};

const clearTokenCookies = (res: Response) => {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });
};

const refreshTokenController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken =
      typeof req.body?.refreshToken === "string" && req.body.refreshToken.trim() !== ""
        ? req.body.refreshToken
        : getCookieValue(req.header("cookie"), "refreshToken");

    if (!refreshToken) {
      res.status(400).json({
        status: "error",
        message: "Refresh token is required",
      });
      return;
    }

    const response = await requestService<AuthTokenResponse>("auth", {
      method: "POST",
      url: buildServiceUrl("auth", "/refresh-token"),
      headers: {
        "Content-Type": "application/json",
      },
      data: { refreshToken },
    });

    const nextAccessToken = response.data.data?.accessToken;
    const nextRefreshToken = response.data.data?.refreshToken;

    if (nextAccessToken && nextRefreshToken) {
      const secure = req.secure || req.header("x-forwarded-proto") === "https";

      setTokenCookie(res, "accessToken", nextAccessToken, secure);
      setTokenCookie(res, "refreshToken", nextRefreshToken, secure);
    }

    res.status(response.status).json(response.data);
  } catch (error) {
    next(error);
  }
};

router.all("/health", forwardAuthRequest);
router.all("/health/db", forwardAuthRequest);
router.all("/login", forwardAuthRequest);
router.post("/register", registerController);
router.post("/refresh-token", refreshTokenController);
router.delete("/session", (_req, res) => {
  clearTokenCookies(res);
  res.status(200).json({ status: "success" });
});
router.use(authMiddleware);
router.use(forwardAuthRequest);

export default router;
