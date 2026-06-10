import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { errorHandler, notFoundHandler } from "./middlewares/error.middleware";
import profileRoutes from "./routes/profile.routes";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/profiles", profileRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
