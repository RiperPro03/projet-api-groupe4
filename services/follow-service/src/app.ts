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

// Endpoint de supervision (utilisé par Docker / monitoring).
app.get("/health", (_req, res) => {
  res.json({
    service: serviceName,
    status: "OK",
  });
});

// Routes métier montées à la racine.
// Via l'API Gateway : /api/follows/* → /* sur ce service.
app.use("/", followRoutes);

export default app;
