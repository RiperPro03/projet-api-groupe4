import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "success",
    service: "api-gateway",
    timestamp: new Date().toISOString(),
  });
});

export default router;
