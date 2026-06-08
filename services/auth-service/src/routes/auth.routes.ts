import { Router } from "express";
import authValidator from "../middlewares/auth.middleware";

import authController from "../controllers/auth.controller";
import os from "os";
import {prisma} from "../config/prisma";

const router = Router();

const serviceName = process.env.SERVICE_NAME || "auth-service";

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
    "/register",
    authValidator.requiredFields(["email", "password"]),
    authValidator.validateRegisterInput,
    authController.register,
);

router.post(
    "/login",
    authValidator.requiredFields(["email", "password"]),
    authValidator.validateLoginInput,
    authController.login,
);

router.post(
    "/refresh-token",
    authValidator.requiredFields(["refreshToken"]),
    authController.refreshToken,
);

router.post(
    "/logout",
    authValidator.authenticate,
    authValidator.requiredFields(["refreshToken"]),
    authController.logout,
);

router.put(
    "/password",
    authValidator.authenticate,
    authValidator.requiredFields(["currentPassword", "newPassword"]),
    authValidator.validatePasswordUpdateInput,
    authController.updatePassword,
);

router.get("/verify", authValidator.authenticate, authController.verify);

export default router;
