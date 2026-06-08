import { Router } from "express";
import {
  addFollowHandler,
  unfollowHandler,
  getFollowingHandler,
  getFollowersHandler,
} from "../controllers/follow.controller.js";

const router = Router();

// Sans auth pour l'instant : les IDs sont passés dans l'URL.
// Plus tard : POST /:followingId avec followerId extrait du JWT.
router.post("/:followerId/:followingId", addFollowHandler);
router.delete("/:followerId/:followingId", unfollowHandler);

// /:id/following et /:id/followers doivent rester distincts
// (on ne peut pas avoir deux GET /:id sur la même route).
router.get("/:id/following", getFollowingHandler);
router.get("/:id/followers", getFollowersHandler);

export default router;
