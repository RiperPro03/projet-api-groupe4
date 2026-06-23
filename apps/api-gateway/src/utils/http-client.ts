import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type Method,
  type RawAxiosRequestHeaders,
} from "axios";
import type { Request, RequestHandler, Response, NextFunction } from "express";

import { env } from "../config/env";
import { buildServiceUrl, getServiceConfig, type ServiceKey } from "../config/services";

const httpClient = axios.create({
  timeout: env.requestTimeoutMs,
});

const hopByHopHeaders = new Set([
  "connection",
  "content-length",
  "host",
  "transfer-encoding",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const buildFallbackPayload = (message: string) => ({
  status: "error",
  message,
});

const extractRelativePath = (originalUrl: string, gatewayPrefix: string) => {
  const queryIndex = originalUrl.indexOf("?");
  const path = queryIndex >= 0 ? originalUrl.slice(0, queryIndex) : originalUrl;
  const query = queryIndex >= 0 ? originalUrl.slice(queryIndex) : "";
  const withoutPrefix = path.startsWith(gatewayPrefix) ? path.slice(gatewayPrefix.length) : path;
  const normalizedPath = withoutPrefix === "" ? "/" : withoutPrefix;

  return `${normalizedPath}${query}`;
};

const getRequestBody = (req: Request) => {
  if (req.method === "GET" || req.method === "HEAD") {
    return undefined;
  }

  return req.body;
};

const getForwardHeaders = (req: Request): RawAxiosRequestHeaders => {
  const headers: RawAxiosRequestHeaders = {};
  const authUser = (req as Request & { authUser?: { id?: unknown; role?: unknown } }).authUser;

  for (const [headerName, headerValue] of Object.entries(req.headers)) {
    const normalizedHeaderName = headerName.toLowerCase();

    if (hopByHopHeaders.has(normalizedHeaderName) || headerValue === undefined) {
      continue;
    }

    headers[headerName] = Array.isArray(headerValue)
      ? headerValue.join(", ")
      : headerValue;
  }

  if (typeof authUser?.id === "string" && authUser.id.length > 0) {
    headers["x-user-id"] = authUser.id;
  }

  if (typeof authUser?.role === "string" && authUser.role.length > 0) {
    headers["x-user-role"] = authUser.role;
  }

  return headers;
};

const setProxyResponseHeaders = (res: Response, response: AxiosResponse) => {
  const contentType = response.headers["content-type"];
  const location = response.headers.location;

  if (typeof contentType === "string" || Array.isArray(contentType)) {
    res.setHeader("content-type", contentType);
  }

  if (typeof location === "string" || Array.isArray(location)) {
    res.setHeader("location", location);
  }
};

const toServiceError = (service: ServiceKey, error: unknown) => {
  const { serviceName } = getServiceConfig(service);

  if (error instanceof ServiceError) {
    return error;
  }

  if (error instanceof AxiosError) {
    if (error.response) {
      const payload = isRecord(error.response.data)
        ? error.response.data
        : buildFallbackPayload(`Request to ${serviceName} failed`);
      const message =
        typeof payload.message === "string"
          ? payload.message
          : `Request to ${serviceName} failed`;

      return new ServiceError(service, error.response.status, message, payload);
    }

    if (error.code === "ECONNABORTED") {
      const message = `${serviceName} timeout`;
      return new ServiceError(service, 504, message, buildFallbackPayload(message));
    }

    const message = `${serviceName} unavailable`;
    return new ServiceError(service, 503, message, buildFallbackPayload(message));
  }

  return new ServiceError(service, 500, "Gateway request failed", buildFallbackPayload("Gateway request failed"));
};

export class ServiceError extends Error {
  constructor(
    public readonly service: ServiceKey,
    public readonly statusCode: number,
    message: string,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export const requestService = async <T>(
  service: ServiceKey,
  config: AxiosRequestConfig,
): Promise<AxiosResponse<T>> => {
  try {
    return await httpClient.request<T>(config);
  } catch (error) {
    throw toServiceError(service, error);
  }
};

export const createForwardHandler = (service: ServiceKey): RequestHandler => {
  const { gatewayPrefix } = getServiceConfig(service);

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const relativePath = extractRelativePath(req.originalUrl, gatewayPrefix);
      const response = await requestService(service, {
        method: req.method as Method,
        url: buildServiceUrl(service, relativePath),
        headers: getForwardHeaders(req),
        data: getRequestBody(req),
      });

      setProxyResponseHeaders(res, response);
      res.status(response.status);

      if (response.data === undefined || response.data === null || response.data === "") {
        res.end();
        return;
      }

      if (typeof response.data === "object") {
        res.json(response.data);
        return;
      }

      res.send(response.data);
    } catch (error) {
      next(toServiceError(service, error));
    }
  };
};
