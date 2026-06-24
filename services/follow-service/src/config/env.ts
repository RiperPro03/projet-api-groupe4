export const env = {
  port: Number(process.env.PORT || 3004),
  serviceName: process.env.SERVICE_NAME || "follow-service",
  internalNginxUrl: (
    process.env.INTERNAL_NGINX_URL ?? "http://nginx-internal"
  ).replace(/\/+$/, ""),
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 10_000),
};
