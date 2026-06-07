import { Router } from "express";
import {
  addFollowHandler,
  unfollowHandler,
  getFollowingHandler,
  getFollowersHandler,
} from "../controllers/follow.controller.js";

const router = Router();

router.post("/:followerId/:followingId", addFollowHandler);
router.delete("/:followerId/:followingId", unfollowHandler);
router.get("/:id/following", getFollowingHandler);
router.get("/:id/followers", getFollowersHandler);

export default router;
