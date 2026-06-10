import { buildServiceUrl } from "../config/services";
import { requestService } from "../utils/http-client";

type ProfileServiceResponse = {
  data?: Record<string, unknown> | null;
};

type CreateProfileGatewayInput = {
  id_user: string;
  username: string;
  nickname?: string;
  bio?: string;
  bibliography?: string;
  url_photo?: string;
};

export const getProfileByUserId = async (
  userId: string,
  authorization: string,
  requestId?: string,
) => {
  const response = await requestService<ProfileServiceResponse>("profiles", {
    method: "GET",
    url: buildServiceUrl("profiles", `/${encodeURIComponent(userId)}`),
    headers: {
      Authorization: authorization,
      ...(requestId ? { "x-request-id": requestId } : {}),
    },
  });

  return response.data.data ?? null;
};

export const createProfile = async (
  payload: CreateProfileGatewayInput,
  requestId?: string,
) => {
  const response = await requestService<ProfileServiceResponse>("profiles", {
    method: "POST",
    url: buildServiceUrl("profiles", "/"),
    headers: {
      "Content-Type": "application/json",
      ...(requestId ? { "x-request-id": requestId } : {}),
    },
    data: payload,
  });

  return response.data.data ?? null;
};
