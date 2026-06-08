import type { RequestHandler } from "express";

export const notImplementedHandler: RequestHandler = (_req, res) => {
  res.status(501).json({
    status: "error",
    message: "Service not implemented yet",
  });
};

export default notImplementedHandler;
