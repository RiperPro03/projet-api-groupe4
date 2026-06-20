export const env = {
  port: Number(process.env.PORT || 3007),
  serviceName: process.env.SERVICE_NAME || "interaction-service",
  mongoUri:
    process.env.MONGO_URI || "mongodb://localhost:27020/interaction_db",
  postServiceUrl: (
    process.env.POST_SERVICE_URL || "http://localhost:3003"
  ).replace(/\/+$/, ""),
  notificationServiceUrl: (
    process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3008"
  ).replace(/\/+$/, ""),
  profileServiceUrl: (
    process.env.PROFILE_SERVICE_URL || "http://localhost:3006"
  ).replace(/\/+$/, ""),
  /** Debug only — set DEBUG_ALLOW_SELF_LIKE_NOTIFICATIONS=true to test inbox solo. */
  debugAllowSelfLikeNotifications:
    process.env.DEBUG_ALLOW_SELF_LIKE_NOTIFICATIONS === "true" ||
    process.env.DEBUG_ALLOW_SELF_LIKE_NOTIFICATIONS === "1",
};
