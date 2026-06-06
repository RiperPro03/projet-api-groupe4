import { Router } from "express";
import { register } from "../controllers/auth.controller";
import authValidator from "../middlewares/auth.middleware";

const router = Router();

router.post(
    "/register",
    authValidator.requiredFields(["email", "password"]),
    authValidator.validateRegisterInput,
    register
);

export default router;