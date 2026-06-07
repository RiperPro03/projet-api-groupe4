import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import followRoutes from "./routes/follow.routes.js";

const app = express();

const serviceName = process.env.SERVICE_NAME || "follow-service";

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

app.use("/", followRoutes);

export default app;
