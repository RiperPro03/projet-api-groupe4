import { Router } from "express";
import {
  addFollowHandler,
  unfollowHandler,
  getFollowingHandler,
  getFollowersHandler,
} from "../controllers/follow.controller.js";
const serviceName = process.env.SERVICE_NAME || "follow-service";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    service: serviceName,
    status: "OK",
  });
});

router.post("/", addFollowHandler);
router.delete("/", unfollowHandler);
router.get("/following", getFollowingHandler);
router.get("/followers", getFollowersHandler);

export default router;
