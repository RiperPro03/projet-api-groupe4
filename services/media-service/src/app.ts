import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mediaRoutes from "./routes/media.routes";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/media", mediaRoutes);

export default app;