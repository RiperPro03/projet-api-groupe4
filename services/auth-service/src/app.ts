import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import os from "os";
import { prisma } from "./config/prisma";

import authRoutes from "./routes/auth.routes";

const app = express();

const serviceName = process.env.SERVICE_NAME || "auth-service";

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/auth", authRoutes);

app.get("/health", (_req, res) => {
  res.json({
    service: serviceName,
    status: "OK",
    hostname: os.hostname(),
  });
});

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
    console.log(error);
  }
});

export default app;
