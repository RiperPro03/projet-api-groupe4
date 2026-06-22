import type { NextFunction, Request, Response } from "express";

import { loginAuthUser, logoutAuthUser } from "../services/auth.service";
import { getUserStateByUserId } from "../services/user.service";

type LoginRequestBody = {
  email?: string;
  password?: string;
};

const SUSPENDED_ACCOUNT_MESSAGE =
  "Your account has been suspended. Please contact a moderator or administrator.";

const toBearerAuthorization = (accessToken: string) => `Bearer ${accessToken}`;

const revokeIssuedSession = async (
  authorization: string,
  refreshToken: string,
  requestId?: string,
) => {
  try {
    await logoutAuthUser(authorization, refreshToken, requestId);
  } catch (error) {
    console.error("Failed to revoke login session", error);
  }
};

export const loginController = async (
  req: Request<Record<string, never>, unknown, LoginRequestBody>,
  res: Response,
  next: NextFunction,
) => {
  let issuedSession: { authorization: string; refreshToken: string } | null = null;

  try {
    const requestId = req.header("x-request-id");
    const authResponse = await loginAuthUser(
      {
        email: req.body.email,
        password: req.body.password,
      },
      requestId,
    );

    const { user, accessToken, refreshToken } = authResponse.data;
    const authorization = toBearerAuthorization(accessToken);
    issuedSession = { authorization, refreshToken };

    const userState = await getUserStateByUserId(user.id, authorization, requestId);

    if (userState?.statuts === "INACTIVE") {
      await revokeIssuedSession(authorization, refreshToken, requestId);
      issuedSession = null;

      return res.status(403).json({
        status: "error",
        message: SUSPENDED_ACCOUNT_MESSAGE,
      });
    }

    issuedSession = null;

    return res.status(200).json(authResponse);
  } catch (error) {
    if (issuedSession) {
      await revokeIssuedSession(
        issuedSession.authorization,
        issuedSession.refreshToken,
        req.header("x-request-id"),
      );
    }

    return next(error);
  }
};
