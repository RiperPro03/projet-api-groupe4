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
};
