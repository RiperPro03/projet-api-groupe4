import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number.parseInt(process.env.PORT ?? "3008", 10),
  serviceName: process.env.SERVICE_NAME ?? "notification-service",
  mongoUri:
    process.env.MONGO_URI ?? "mongodb://localhost:27023/notification_db",
} as const;
