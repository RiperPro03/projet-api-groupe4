export const env = {
  port: Number(process.env.PORT || 3007),
  serviceName: process.env.SERVICE_NAME || "interaction-service",
  mongoUri:
    process.env.MONGO_URI || "mongodb://localhost:27020/interaction_db",
};
