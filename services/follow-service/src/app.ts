import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import followRoutes from "./routes/follow.routes.js";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Routes métier montées à la racine.
app.use("/follows", followRoutes);

export default app;
