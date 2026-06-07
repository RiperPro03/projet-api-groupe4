import { Router } from "express";
import authValidator from "../middlewares/auth.middleware";

import authController from "../controllers/auth.controller";

const router = Router();

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

router.get("/verify", authValidator.authenticate, authController.verify);

export default router;
