import { env } from "../config/env.js";

type ProfileResponseBody = {
  status?: string;
  data?: {
    id_user?: string;
    username?: string;
  };
};

export async function getUserIdByUsername(
  username: string
): Promise<string | null> {
  const normalizedUsername = username.trim().toLowerCase();

  if (!normalizedUsername) {
    return null;
  }

  const response = await fetch(
    `${env.profileServiceUrl}/profiles/username/${encodeURIComponent(normalizedUsername)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  const body = (await response.json()) as ProfileResponseBody;
  const userId = body.data?.id_user?.trim();

  return userId || null;
}
