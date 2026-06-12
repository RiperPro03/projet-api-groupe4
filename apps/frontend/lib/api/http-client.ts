import axios from "axios";
import { getStoredAccessToken } from "@/lib/auth-token-storage";

export type ApiErrorBody = {
  message?: string;
};

export const httpClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

httpClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }

  const token = getStoredAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return (
      error.response?.data?.message ??
      "Impossible de joindre le serveur. Reessayez dans un instant."
    );
  }

  return "Une erreur inattendue est survenue.";
}
