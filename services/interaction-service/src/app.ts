import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";
import commentRoutes from "./routes/comment.routes.js";
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
app.use("/", commentRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
