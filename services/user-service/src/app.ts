import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import reportRoute from "./routes/report.routes";
import userRoute from "./routes/user.routes";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/users-state/reports", reportRoute);
app.use("/users-state", userRoute);

export default app;
