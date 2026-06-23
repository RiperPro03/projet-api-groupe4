import type { RoleMention } from "../utils/mention.utils.js";
import { internalHttpClient } from "./internal-http.client.js";

type UserStatesByRoleResponseBody = {
  status?: string;
  data?: {
    users?: Array<{
      id_user?: string;
    }>;
  };
};

export async function getUserIdsByRole(role: RoleMention): Promise<string[]> {
  try {
    const { data } = await internalHttpClient.get<UserStatesByRoleResponseBody>(
      `/users/by-role/${encodeURIComponent(role)}`,
    );
    const users = data.data?.users ?? [];

    return users
      .map((user) => user.id_user?.trim())
      .filter((userId): userId is string => Boolean(userId));
  } catch {
    return [];
  }
}
