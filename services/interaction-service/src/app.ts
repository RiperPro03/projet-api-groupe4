import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import likeRoutes from "./routes/like.routes.js";

const app = express();

const serviceName = process.env.SERVICE_NAME || "interaction-service";

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    service: serviceName,
    status: "OK",
  });
});

app.use("/", likeRoutes);

export default app;
