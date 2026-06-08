import type { Response } from "express";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";

import { env } from "../config/env";

const rewriteAuthPath = (path: string) => {
  // Nginx owns the public /api prefix, so the gateway only handles /auth here.
  const strippedPath = path.replace(/^\/auth/, "") || "/";

  return strippedPath === "/" ? "/auth" : `/auth${strippedPath}`;
};

const forwardHeader = (
  proxyReq: {
    setHeader: (name: string, value: string) => void;
  },
  headerName: string,
  value: string | string[] | undefined,
) => {
  if (typeof value === "string" && value.length > 0) {
    proxyReq.setHeader(headerName, value);
    return;
  }

  if (Array.isArray(value) && value.length > 0) {
    proxyReq.setHeader(headerName, value.join(","));
  }
};

const authProxy = createProxyMiddleware({
  target: env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathFilter: "/auth",
  xfwd: true,
  // Forward gateway auth routes to the internal auth-service routes mounted under /auth.
  pathRewrite: (path) => rewriteAuthPath(path),
  on: {
    proxyReq: (proxyReq, req) => {
      forwardHeader(proxyReq, "host", req.headers.host);
      forwardHeader(proxyReq, "x-real-ip", req.headers["x-real-ip"]);
      forwardHeader(proxyReq, "x-forwarded-for", req.headers["x-forwarded-for"]);
      forwardHeader(proxyReq, "x-forwarded-proto", req.headers["x-forwarded-proto"]);
      forwardHeader(proxyReq, "x-request-id", req.headers["x-request-id"]);

      // fixRequestBody may write the proxied payload, so custom headers must be set first.
      fixRequestBody(proxyReq, req);
    },
    error: (_error, _req, res) => {
      const response = res as Response;

      if (response.headersSent) {
        response.end();
        return;
      }

      response.status(503).json({
        status: "error",
        message: "Auth service unavailable",
      });
    },
  },
});

export default authProxy;
