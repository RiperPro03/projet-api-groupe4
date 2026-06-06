import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import os from "os";

const app = express();

const serviceName = process.env.SERVICE_NAME || "auth-service";

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    service: serviceName,
    status: "OK",
    hostname: os.hostname(),
  });
});

import { prisma } from "./config/prisma";
app.get("/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      service: serviceName,
      database: "OK",
      status: "OK",
    });
  } catch (error) {
    res.status(500).json({
      service: serviceName,
      database: "ERROR",
      status: "KO",
      message: "Database connection failed",
    });
  }
});

export default app;
