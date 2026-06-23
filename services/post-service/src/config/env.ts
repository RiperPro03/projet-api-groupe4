import "dotenv/config";

const requiredEnv = (key: string): string => {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3003),
  mongoUri: requiredEnv("MONGO_URI"),
  internalNginxUrl: (
    process.env.INTERNAL_NGINX_URL ?? "http://nginx-internal"
  ).replace(/\/+$/, ""),
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 10_000),
};
