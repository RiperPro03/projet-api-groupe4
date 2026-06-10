import { buildServiceUrl } from "../config/services";
import { requestService } from "../utils/http-client";

type UserServiceResponse = {
  data?: Record<string, unknown> | null;
};

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
