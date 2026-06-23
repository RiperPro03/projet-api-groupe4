import { internalHttpClient } from "./internal-http.client.js";

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

  try {
    const { data } = await internalHttpClient.get<ProfileResponseBody>(
      `/profiles/username/${encodeURIComponent(normalizedUsername)}`
    );
    const userId = data.data?.id_user?.trim();

    return userId || null;
  } catch {
    return null;
  }
}
