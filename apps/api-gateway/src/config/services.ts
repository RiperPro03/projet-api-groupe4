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
  posts: {
    serviceName: "post-service",
    gatewayPrefix: "/posts",
    internalBasePath: "/posts",
  },
  follows: {
    serviceName: "follow-service",
    gatewayPrefix: "/follows",
    internalBasePath: "/follows",
  },
  interactions: {
    serviceName: "interaction-service",
    gatewayPrefix: "",
    internalBasePath: "/interactions",
  },
} as const;

export type ServiceKey = keyof typeof servicesConfig;

export const getServiceConfig = (service: ServiceKey) => servicesConfig[service];

export const buildServiceUrl = (service: ServiceKey, relativePath = "/") => {
  const { internalBasePath } = getServiceConfig(service);
  const normalizedPath = relativePath === "" || relativePath === "/" ? "/" : relativePath.startsWith("/") ? relativePath : `/${relativePath}`;

  return `${env.internalNginxUrl}${internalBasePath}${normalizedPath}`;
};
