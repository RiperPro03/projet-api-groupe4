import type { Request, Response } from "express";

import { registerUserWithDefaults } from "../services/register.service";

type RegisterRequestBody = {
  email?: string;
  password?: string;
  username?: string;
  nickname?: string;
  bio?: string;
  bibliography?: string;
  url_photo?: string;
};

export const registerController = async (
  req: Request<Record<string, never>, unknown, RegisterRequestBody>,
  res: Response,
) => {
  const { email, password, username, nickname, bio, bibliography, url_photo } = req.body;

  if (typeof username !== "string" || username.trim().length === 0) {
    return res.status(400).json({
      status: "error",
      message: "The following fields are required: username",
    });
  }

  const authResponse = await registerUserWithDefaults(
    {
      email,
      password,
      username,
      nickname,
      bio,
      bibliography,
      url_photo,
    },
    req.header("x-request-id"),
  );

  return res.status(201).json(authResponse);
};
