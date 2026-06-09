import dotenv from "dotenv";

dotenv.config();

const port = Number.parseInt(process.env.PORT ?? "3000", 10);

if (Number.isNaN(port)) {
  throw new Error("PORT must be a valid number");
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: port,
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL ?? "http://auth-service:3001",
} as const;

export default env;
