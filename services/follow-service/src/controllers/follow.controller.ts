import type { Request, Response } from "express";
import {
  addFollow,
  unfollow,
  getFollowing,
  getFollowers,
  FollowError,
} from "../services/follow.service.js";
import { notifyFollowSafely } from "../services/follow-notification.service.js";

function getBodyIds(req: Request): { followerId: string; followingId: string } | null {
  const { followerId, followingId } = req.body;

  if (
    typeof followerId !== "string" ||
    typeof followingId !== "string" ||
    !followerId.trim() ||
    !followingId.trim()
  ) {
    return null;
  }

  return { followerId: followerId.trim(), followingId: followingId.trim() };
}

function getFollowerId(req: Request): string | null {
  const bodyFollowerId = req.body?.followerId;
  if (typeof bodyFollowerId === "string" && bodyFollowerId.trim()) {
    return bodyFollowerId.trim();
  }

  const queryFollowerId = req.query.followerId;
  return typeof queryFollowerId === "string" && queryFollowerId.trim()
    ? queryFollowerId.trim()
    : null;
}

function getFollowingId(req: Request): string | null {
  const bodyFollowingId = req.body?.followingId;
  if (typeof bodyFollowingId === "string" && bodyFollowingId.trim()) {
    return bodyFollowingId.trim();
  }

  const queryFollowingId = req.query.followingId;
  return typeof queryFollowingId === "string" && queryFollowingId.trim()
    ? queryFollowingId.trim()
    : null;
}

/** Couche HTTP : lit le body, appelle le service, renvoie le JSON. */
export async function addFollowHandler(req: Request, res: Response) {
  try {
    const ids = getBodyIds(req);
    if (!ids) {
      res.status(400).json({ error: "followerId et followingId sont requis" });
      return;
    }

    const follow = await addFollow(ids.followerId, ids.followingId);
    notifyFollowSafely(ids.followerId, ids.followingId);
    res.status(201).json(follow);
  } catch (error) {
    handleError(error, res);
  }
}

export async function unfollowHandler(req: Request, res: Response) {
  try {
    const ids = getBodyIds(req);
    if (!ids) {
      res.status(400).json({ error: "followerId et followingId sont requis" });
      return;
    }

    await unfollow(ids.followerId, ids.followingId);
    res.status(200).json({ message: "Abonnement supprimé" });
  } catch (error) {
    handleError(error, res);
  }
}

export async function getFollowingHandler(req: Request, res: Response) {
  try {
    const followerId = getFollowerId(req);
    if (!followerId) {
      res.status(400).json({ error: "followerId est requis" });
      return;
    }

    const following = await getFollowing(followerId);
    res.status(200).json(following);
  } catch (error) {
    handleError(error, res);
  }
}

export async function getFollowersHandler(req: Request, res: Response) {
  try {
    const followingId = getFollowingId(req);
    if (!followingId) {
      res.status(400).json({ error: "followingId est requis" });
      return;
    }

    const followers = await getFollowers(followingId);
    res.status(200).json(followers);
  } catch (error) {
    handleError(error, res);
  }
}

/** Traduit les erreurs métier (FollowError) en réponses HTTP. */
function handleError(error: unknown, res: Response) {
  if (error instanceof FollowError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "Erreur interne du serveur" });
}
