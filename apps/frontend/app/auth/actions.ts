"use server";

import { cookies } from "next/headers";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
} from "@/lib/auth-token-storage";
import { getServerI18n } from "@/lib/i18n/server";

const TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

type AuthPayload = {
  email: string;
  password: string;
};

type RegisterPayload = AuthPayload & {
  username: string;
};

type AuthActionResult =
  | {
      status: "success";
      data: {
        accessToken: string;
        refreshToken: string;
      };
    }
  | {
      status: "error";
      message: string;
    };

type AuthResponse = {
  message?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
  };
};

function getApiUrl(path: string) {
  const baseUrl =
    process.env.INTERNAL_API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8080/api";

  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

async function readAuthResponse(
  response: Response,
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  const data = (await response.json().catch(() => null)) as AuthResponse | null;

  if (!response.ok) {
    return {
      ok: false as const,
      message: data?.message ?? t("auth.authErrorTitle"),
    };
  }

  const accessToken = data?.data?.accessToken;
  const refreshToken = data?.data?.refreshToken;

  if (!accessToken || !refreshToken) {
    return {
      ok: false as const,
      message: t("common.unknownError"),
    };
  }

  return {
    ok: true as const,
    data: {
      accessToken,
      refreshToken,
    },
  };
}

async function createHttpOnlySession(tokens: {
  accessToken: string;
  refreshToken: string;
}) {
  const cookieStore = await cookies();
  const secure = process.env.COOKIE_SECURE === "true";

  cookieStore.set(ACCESS_TOKEN_KEY, tokens.accessToken, {
    httpOnly: true,
    maxAge: TOKEN_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure,
  });

  cookieStore.set(REFRESH_TOKEN_KEY, tokens.refreshToken, {
    httpOnly: true,
    maxAge: TOKEN_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure,
  });
}

async function clearHttpOnlySession() {
  const cookieStore = await cookies();

  cookieStore.delete(ACCESS_TOKEN_KEY);
  cookieStore.delete(REFRESH_TOKEN_KEY);
}

async function requestLogin(payload: AuthPayload): Promise<AuthActionResult> {
  const { t } = await getServerI18n();

  await clearHttpOnlySession();

  const response = await fetch(getApiUrl("/auth/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const result = await readAuthResponse(response, t);

  if (!result.ok) {
    await clearHttpOnlySession();

    return {
      status: "error",
      message: result.message,
    };
  }

  await createHttpOnlySession(result.data);

  return {
    status: "success",
    data: result.data,
  };
}

export async function loginAction(
  payload: AuthPayload,
): Promise<AuthActionResult> {
  return requestLogin(payload);
}

export async function registerAction(
  payload: RegisterPayload,
): Promise<AuthActionResult> {
  const { t } = await getServerI18n();
  const response = await fetch(getApiUrl("/auth/register"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as AuthResponse | null;

    return {
      status: "error",
      message: data?.message ?? t("auth.authErrorTitle"),
    };
  }

  return requestLogin({
    email: payload.email,
    password: payload.password,
  });
}

export async function logoutAction() {
  const cookieStore = await cookies();

  cookieStore.delete(ACCESS_TOKEN_KEY);
  cookieStore.delete(REFRESH_TOKEN_KEY);
}
