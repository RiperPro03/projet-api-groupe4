import { randomUUID } from "node:crypto";

import type { RequestHandler } from "express";

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const existingRequestId = req.header("x-request-id");
  const requestId =
    typeof existingRequestId === "string" && existingRequestId.trim().length > 0
      ? existingRequestId
      : randomUUID();

  req.headers["x-request-id"] = requestId;
  res.setHeader("x-request-id", requestId);

  next();
};

export default requestIdMiddleware;
