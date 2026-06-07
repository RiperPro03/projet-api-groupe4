import type { Request, Response } from "express";
import {
  addFollow,
  unfollow,
  getFollowing,
  getFollowers,
  FollowError,
} from "../services/follow.service.js";

function param(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

export async function addFollowHandler(req: Request, res: Response) {
  try {
    const followerId = param(req.params.followerId);
    const followingId = param(req.params.followingId);
    const follow = await addFollow(followerId, followingId);
    res.status(201).json(follow);
  } catch (error) {
    handleError(error, res);
  }
}

export async function unfollowHandler(req: Request, res: Response) {
  try {
    const followerId = param(req.params.followerId);
    const followingId = param(req.params.followingId);
    await unfollow(followerId, followingId);
    res.status(200).json({ message: "Abonnement supprimé" });
  } catch (error) {
    handleError(error, res);
  }
}

export async function getFollowingHandler(req: Request, res: Response) {
  try {
    const id = param(req.params.id);
    const following = await getFollowing(id);
    res.status(200).json(following);
  } catch (error) {
    handleError(error, res);
  }
}

export async function getFollowersHandler(req: Request, res: Response) {
  try {
    const id = param(req.params.id);
    const followers = await getFollowers(id);
    res.status(200).json(followers);
  } catch (error) {
    handleError(error, res);
  }
}

function handleError(error: unknown, res: Response) {
  if (error instanceof FollowError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  console.error(error);
  res.status(500).json({ error: "Erreur interne du serveur" });
}
