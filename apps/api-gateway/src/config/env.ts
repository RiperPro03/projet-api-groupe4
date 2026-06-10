import dotenv from "dotenv";

dotenv.config();

const parseNumber = (value: string | undefined, fallback: number, name: string) => {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue)) {
    throw new Error(`${name} must be a valid number`);
  }

  return parsedValue;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseNumber(process.env.PORT, 3000, "PORT"),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  internalNginxUrl: (process.env.INTERNAL_NGINX_URL ?? "http://nginx-internal:80").replace(/\/+$/, ""),
  requestTimeoutMs: parseNumber(process.env.REQUEST_TIMEOUT_MS, 10000, "REQUEST_TIMEOUT_MS"),
} as const;
