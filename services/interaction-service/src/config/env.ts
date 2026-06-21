export const env = {
  port: Number(process.env.PORT || 3007),
  serviceName: process.env.SERVICE_NAME || "interaction-service",
  mongoUri:
    process.env.MONGO_URI || "mongodb://localhost:27020/interaction_db",
  internalNginxUrl: (
    process.env.INTERNAL_NGINX_URL ?? "http://nginx-internal"
  ).replace(/\/+$/, ""),
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 10_000),
  /** Debug only — set DEBUG_ALLOW_SELF_LIKE_NOTIFICATIONS=true to test inbox solo. */
  debugAllowSelfLikeNotifications:
    process.env.DEBUG_ALLOW_SELF_LIKE_NOTIFICATIONS === "true" ||
    process.env.DEBUG_ALLOW_SELF_LIKE_NOTIFICATIONS === "1",
};
