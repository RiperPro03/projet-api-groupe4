import { Router } from "express";

import authMiddleware from "../middlewares/auth.middleware";
import authRoutes from "./auth.routes";
import feedRoutes from "./feed.routes";
import followsRoutes from "./follows.routes";
import healthRoutes from "./health.routes";
import postsRoutes from "./posts.routes";
import usersRoutes from "./users.routes";

const router = Router();

router.use(healthRoutes);
router.use(authRoutes);
router.use(authMiddleware);
router.use("/users", usersRoutes);
router.use("/posts", postsRoutes);
router.use("/feed", feedRoutes);
router.use("/follows", followsRoutes);

export default router;
