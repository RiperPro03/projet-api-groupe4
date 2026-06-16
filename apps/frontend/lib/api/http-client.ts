import axios from "axios";

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

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== "undefined"
    ) {
      await fetch("/api/auth/session", {
        method: "DELETE",
        cache: "no-store",
      }).catch(() => undefined);

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
