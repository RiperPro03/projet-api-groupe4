import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env";
import { globalErrorHandler, notFoundMiddleware } from "./middlewares/error.middleware";
import gatewayRoutes from "./routes/gateway.routes";
import os from "os";

const app = express();

app.set("trust proxy", true);
app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin,
  }),
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      service: "api-gateway",
      hostname: os.hostname(),
    },
  });
});

app.use(gatewayRoutes);
app.use(notFoundMiddleware);
app.use(globalErrorHandler);

export default app;
