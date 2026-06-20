"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from "@/lib/auth-token-storage";
import { getCurrentUser } from "@/lib/current-user";
import { getServerI18n } from "@/lib/i18n/server";

export type UpdateProfilePayload = {
  username: string;
  nickname: string;
  bio: string;
  url_photo: string;
};

type UpdateProfileResult =
  | { status: "success" }
  | { status: "error"; message: string };

export type UpdatePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

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
  const { t } = await getServerI18n();
  const username = payload.username.trim();

  if (!username) {
    return {
      status: "error",
      message: t("api.profileUsernameRequired"),
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
      message: t("api.sessionExpired"),
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
      message: data?.message ?? t("api.profileUpdateImpossible"),
    };
  }

  revalidatePath("/profile");

  return { status: "success" };
}

export async function updatePasswordAction(
  payload: UpdatePasswordPayload,
): Promise<UpdateProfileResult> {
  const { t } = await getServerI18n();

  if (!payload.currentPassword || !payload.newPassword) {
    return {
      status: "error",
      message: t("api.fieldsRequired"),
    };
  }

  if (payload.newPassword.length < 8) {
    return {
      status: "error",
      message: t("api.newPasswordTooShort"),
    };
  }

  if (payload.currentPassword === payload.newPassword) {
    return {
      status: "error",
      message: t("api.newPasswordSame"),
    };
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_KEY)?.value;

  if (!accessToken) {
    return {
      status: "error",
      message: t("api.sessionExpired"),
    };
  }

  const response = await fetch(getApiUrl("/auth/password"), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as ErrorResponse | null;

    return {
      status: "error",
      message:
        data?.message === "Invalid current password"
          ? t("api.invalidCurrentPassword")
          : data?.message ?? t("api.passwordUpdateImpossible"),
    };
  }

  cookieStore.delete(ACCESS_TOKEN_KEY);
  cookieStore.delete(REFRESH_TOKEN_KEY);

  return { status: "success" };
}
