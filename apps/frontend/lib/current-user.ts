import { cookies } from "next/headers";
import { ACCESS_TOKEN_KEY } from "@/lib/auth-token-storage";
import type { CurrentUser } from "@/lib/current-user.shared";

export type { CurrentUser } from "@/lib/current-user.shared";

type CurrentUserResponse = {
  status: "success";
  data: CurrentUser;
};

function getApiUrl(path: string) {
  const baseUrl =
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8080/api";

  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_KEY)?.value;

  if (!accessToken) {
    return null;
  }

  const response = await fetch(getApiUrl("/me"), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Impossible de charger le profil de l'utilisateur.");
  }

  const result = (await response.json()) as CurrentUserResponse;

  return result.data;
}
