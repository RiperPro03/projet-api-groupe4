import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import postRoutes from "./routes/post.routes";

const app = express();

// ──────────────────────────────────────────────
// Middlewares globaux (même base que auth-service)
// ──────────────────────────────────────────────
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json()); // Indispensable pour lire req.body (workshop étape 3)

// ──────────────────────────────────────────────
// Routes
// Préfixe /posts — convention REST de l'api-gateway du projet
// ──────────────────────────────────────────────
app.use("/posts", postRoutes);

export default app;
