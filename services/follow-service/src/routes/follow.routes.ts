import { Router } from "express";
import {
  addFollowHandler,
  unfollowHandler,
  getFollowingHandler,
  getFollowersHandler,
} from "../controllers/follow.controller.js";

const router = Router();

router.post("/", addFollowHandler);
router.delete("/", unfollowHandler);
router.get("/following", getFollowingHandler);
router.get("/followers", getFollowersHandler);

export default router;
