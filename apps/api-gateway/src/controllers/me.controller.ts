import type { Response } from "express";

import { unauthorizedPayload, type AuthenticatedRequest } from "../middlewares/auth.middleware";
import { getAuthenticatedUserDetails } from "../services/auth.service";
import { getProfileByUserId } from "../services/profile.service";
import { getUserStateByUserId } from "../services/user.service";
import { ServiceError } from "../utils/http-client";

const optionalResource = async <T>(promise: Promise<T>) => {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ServiceError && error.statusCode === 404) {
      return null;
    }

    throw error;
  }
};

export const getMeController = async (req: AuthenticatedRequest, res: Response) => {
  const authorization = req.header("authorization");
  const requestId = req.header("x-request-id");

  if (!authorization || !req.authUser?.id) {
    return res.status(401).json(unauthorizedPayload);
  }

  const auth = await getAuthenticatedUserDetails(authorization, requestId);
  const userId = typeof auth.id === "string" && auth.id.length > 0 ? auth.id : req.authUser.id;

  const [user, profile] = await Promise.all([
    optionalResource(getUserStateByUserId(userId, authorization, requestId)),
    optionalResource(getProfileByUserId(userId, authorization, requestId)),
  ]);

  return res.status(200).json({
    status: "success",
    data: {
      auth,
      user,
      profile,
    },
  });
};
