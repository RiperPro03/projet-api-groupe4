import dotenv from "dotenv";

dotenv.config();

function parseNumber(value: string | undefined, fallback: number, name: string) {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue)) {
    throw new Error(`${name} must be a valid number`);
  }

  return parsedValue;
}

function parseCorsOrigin(value: string | undefined) {
  if (!value || value.trim() === "" || value.trim() === "*") {
    return true;
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const internalNginxUrl = (process.env.INTERNAL_NGINX_URL ?? "http://nginx-internal")
  .replace(/\/+$/, "");

export const env = {
  port: parseNumber(process.env.PORT, 3009, "PORT"),
  serviceName: process.env.SERVICE_NAME ?? "chat-service",
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
  authVerifyUrl: process.env.AUTH_VERIFY_URL ?? `${internalNginxUrl}/auth/verify`,
  requestTimeoutMs: parseNumber(process.env.REQUEST_TIMEOUT_MS, 5000, "REQUEST_TIMEOUT_MS"),
  socketPath: process.env.SOCKET_PATH ?? "/chat/socket.io",
  messageMaxLength: parseNumber(process.env.MESSAGE_MAX_LENGTH, 1000, "MESSAGE_MAX_LENGTH"),
} as const;
