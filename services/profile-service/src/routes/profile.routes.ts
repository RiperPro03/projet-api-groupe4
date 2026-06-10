import { Router } from "express";
import os from "os";

import { getDatabaseStatus } from "../config/database";
import {
  createProfileController,
  deleteProfileController,
  getProfileByIdController,
  getProfilesController,
  updateProfileController,
} from "../controllers/profile.controller";

const router = Router();

const serviceName = process.env.SERVICE_NAME || "profile-service";

router.get("/health", (_req, res) => {
  res.status(200).json({
    service: serviceName,
    status: "OK",
    hostname: os.hostname(),
    database: getDatabaseStatus(),
  });
});

router.post("/", createProfileController);
router.get("/", getProfilesController);
router.get("/:id_user", getProfileByIdController);
router.put("/:id_user", updateProfileController);
router.patch("/:id_user", updateProfileController);
router.delete("/:id_user", deleteProfileController);

export default router;
