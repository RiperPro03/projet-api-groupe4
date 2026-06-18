import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware";
import { getMeController } from "../controllers/me.controller";
import authGatewayRoutes from "./auth.gateway.routes";
import followGatewayRoutes from "./follow.gateway.routes";
import interactionGatewayRoutes from "./interaction.gateway.routes";
import mediaGatewayRoutes from "./media.gateway.routes";
import postGatewayRoutes from "./post.gateway.routes";
import profileGatewayRoutes from "./profile.gateway.routes";
import userGatewayRoutes from "./user.gateway.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      service: "api-gateway",
    },
  });
});

router.get("/me", authMiddleware, getMeController);
router.use("/auth", authGatewayRoutes);
router.use("/follows", followGatewayRoutes);
router.use(interactionGatewayRoutes);
router.use("/media", mediaGatewayRoutes);
router.use("/posts", postGatewayRoutes);
router.use("/users", userGatewayRoutes);
router.use("/profiles", profileGatewayRoutes);

export default router;
