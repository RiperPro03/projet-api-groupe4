import { env } from "./env";

export const servicesConfig = {
  auth: {
    serviceName: "auth-service",
    gatewayPrefix: "/auth",
    internalBasePath: "/auth",
  },
  users: {
    serviceName: "user-service",
    gatewayPrefix: "/users",
    internalBasePath: "/users",
  },
  profiles: {
    serviceName: "profile-service",
    gatewayPrefix: "/profiles",
    internalBasePath: "/profiles",
  },
  follows: {
    serviceName: "follow-service",
    gatewayPrefix: "/follows",
    internalBasePath: "/follows",
  },
} as const;

export type ServiceKey = keyof typeof servicesConfig;

export const getServiceConfig = (service: ServiceKey) => servicesConfig[service];

export const buildServiceUrl = (service: ServiceKey, relativePath = "/") => {
  const { internalBasePath } = getServiceConfig(service);
  const normalizedPath = relativePath === "" || relativePath === "/" ? "/" : relativePath.startsWith("/") ? relativePath : `/${relativePath}`;

  return `${env.internalNginxUrl}${internalBasePath}${normalizedPath}`;
};
