import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number.parseInt(process.env.PORT ?? "3008", 10),
  serviceName: process.env.SERVICE_NAME ?? "notification-service",
  mongoUri:
    process.env.MONGO_URI ?? "mongodb://localhost:27023/notification_db",
  /** Debug only — set DEBUG_ALLOW_SELF_LIKE_NOTIFICATIONS=true to test inbox solo. */
  debugAllowSelfLikeNotifications:
    process.env.DEBUG_ALLOW_SELF_LIKE_NOTIFICATIONS === "true" ||
    process.env.DEBUG_ALLOW_SELF_LIKE_NOTIFICATIONS === "1",
} as const;
