"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_KEY } from "@/lib/auth-token-storage";
import { getCurrentUser } from "@/lib/current-user";

export type UpdateProfilePayload = {
  username: string;
  nickname: string;
  bio: string;
  url_photo: string;
};

type UpdateProfileResult =
  | { status: "success" }
  | { status: "error"; message: string };

type ErrorResponse = {
  message?: string;
};

function getApiUrl(path: string) {
  const baseUrl =
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8080/api";

  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

export async function updateCurrentProfileAction(
  payload: UpdateProfilePayload,
): Promise<UpdateProfileResult> {
  const username = payload.username.trim();

  if (!username) {
    return {
      status: "error",
      message: "Le nom d'utilisateur est obligatoire.",
    };
  }

  const [currentUser, cookieStore] = await Promise.all([
    getCurrentUser(),
    cookies(),
  ]);
  const accessToken = cookieStore.get(ACCESS_TOKEN_KEY)?.value;

  if (!currentUser || !accessToken) {
    return {
      status: "error",
      message: "Votre session a expiré. Reconnectez-vous.",
    };
  }

  const response = await fetch(
    getApiUrl(`/profiles/${encodeURIComponent(currentUser.auth.id)}`),
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        nickname: payload.nickname.trim(),
        bio: payload.bio.trim(),
        url_photo: payload.url_photo.trim(),
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as ErrorResponse | null;

    return {
      status: "error",
      message: data?.message ?? "Impossible de modifier le profil.",
    };
  }

  revalidatePath("/profile");

  return { status: "success" };
}
