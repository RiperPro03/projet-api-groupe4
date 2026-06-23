import { Router } from "express";
import os from "os";
import { prisma } from "../config/prisma";
import {
  createUserStateController,
  deleteUserStateController,
  getUserStateByIdController,
  getUserStatesByRoleController,
  updateUserStateController,
} from "../controllers/user.controller";
import {
  validateCreateUserState,
  validateUpdateUserState,
  validateUserStateParams,
  validateUserStateRoleParams,
} from "../middlewares/user-state.validator";
import type { UserStateParams, UserStateRoleParams } from "../models/user.model";

const router = Router();

const serviceName = process.env.SERVICE_NAME || "users-service";

router.get("/health", (_req, res) => {
  res.json({
    service: serviceName,
    status: "OK",
    hostname: os.hostname(),
  });
});

router.get("/health/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      service: serviceName,
      database: "OK",
      status: "OK",
    });
  } catch (error) {
    res.status(500).json({
      service: serviceName,
      database: "ERROR",
      status: "KO",
      message: "Database connection failed",
    });
    console.log(error);
  }
});

router.post(
  "/",
  validateCreateUserState,
  createUserStateController,
);

router.get<UserStateRoleParams>(
  "/by-role/:role",
  validateUserStateRoleParams,
  getUserStatesByRoleController,
);

router.get<UserStateParams>(
  "/:id_user",
  validateUserStateParams,
  getUserStateByIdController,
);

router.put<UserStateParams>(
  "/:id_user",
  validateUserStateParams,
  validateUpdateUserState,
  updateUserStateController,
);

router.delete<UserStateParams>(
  "/:id_user",
  validateUserStateParams,
  deleteUserStateController,
);

export default router;
