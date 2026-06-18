import axios from "axios";
import type { AxiosRequestConfig } from "axios";

export type ApiErrorBody = {
  message?: string;
  error?: string;
};

export const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<boolean> | null = null;
const sessionClient = axios.create({
  withCredentials: true,
});

async function refreshSession() {
  refreshPromise ??= sessionClient
    .post("/api/auth/refresh-token", undefined, {
      validateStatus: () => true,
    })
    .then((response) => response.status >= 200 && response.status < 300)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalConfig = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      originalConfig &&
      !originalConfig._retry
    ) {
      originalConfig._retry = true;

      if (await refreshSession()) {
        return httpClient.request(originalConfig);
      }

      await sessionClient.delete("/api/auth/session").catch(() => undefined);

      if (!window.location.pathname.startsWith("/login")) {
        const redirect = `${window.location.pathname}${window.location.search}`;
        window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
      }
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error ??
      "Impossible de joindre le serveur. Reessayez dans un instant."
    );
  }

  return "Une erreur inattendue est survenue.";
}

export function isApiStatusCode(error: unknown, statusCode: number) {
  return axios.isAxiosError(error) && error.response?.status === statusCode;
}
