import { env } from "../config/env.js";
import type { AuthenticatedUser } from "../types/chat.types.js";

type VerifyResponse = {
  data?: {
    user?: AuthenticatedUser;
  };
};

export class AuthClientError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthClientError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractVerifiedUser(payload: unknown) {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    return null;
  }

  const user = payload.data.user;

  if (!isRecord(user) || typeof user.id !== "string" || user.id.trim() === "") {
    return null;
  }

  return user as AuthenticatedUser;
}

export async function verifyAccessToken(authorization: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.requestTimeoutMs);

  try {
    const response = await fetch(env.authVerifyUrl, {
      method: "GET",
      headers: {
        Authorization: authorization,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new AuthClientError();
    }

    const payload = (await response.json()) as VerifyResponse;
    const user = extractVerifiedUser(payload);

    if (!user) {
      throw new AuthClientError("Invalid response from auth-service");
    }

    return user;
  } catch (error) {
    if (error instanceof AuthClientError) {
      throw error;
    }

    throw new AuthClientError("Unable to verify access token");
  } finally {
    clearTimeout(timeout);
  }
}
