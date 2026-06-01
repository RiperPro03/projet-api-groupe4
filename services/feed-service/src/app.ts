import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

const app = express();

const serviceName = process.env.SERVICE_NAME || "feed-service";

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    service: serviceName,
    status: "OK"
  });
});

export default app;
