import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env.js";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({
    service: env.serviceName,
    status: "OK",
    mode: "ephemeral",
  });
});

app.get("/", (_req, res) => {
  res.status(200).json({
    service: env.serviceName,
    status: "OK",
    socketPath: env.socketPath,
  });
});

export default app;
