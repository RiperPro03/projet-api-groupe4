import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env";
import { globalErrorHandler, notFoundMiddleware } from "./middlewares/error.middleware";
import { requestIdMiddleware } from "./middlewares/request-id.middleware";
import routes from "./routes/index";

const app = express();

app.set("trust proxy", true);

app.use(requestIdMiddleware);
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
  }),
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(routes);
app.use(notFoundMiddleware);
app.use(globalErrorHandler);

export default app;
