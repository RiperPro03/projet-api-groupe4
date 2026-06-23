import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { loginController } from "../../src/controllers/auth.controller";
import { loginAuthUser, logoutAuthUser } from "../../src/services/auth.service";
import { getUserStateByUserId } from "../../src/services/user.service";

vi.mock("../../src/services/auth.service", () => ({
  loginAuthUser: vi.fn(),
  logoutAuthUser: vi.fn(),
}));

vi.mock("../../src/services/user.service", () => ({
  getUserStateByUserId: vi.fn(),
}));

type MockResponse = Response & {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

const createResponse = (): MockResponse => {
  const response = {
    locals: {},
  } as MockResponse;

  response.status = vi.fn((statusCode: number) => {
    response.statusCode = statusCode;
    return response;
  }) as MockResponse["status"];

  response.json = vi.fn((body: unknown) => {
    response.locals.body = body;
    return response;
  }) as MockResponse["json"];

  return response;
};

const createLoginRequest = () =>
  ({
    body: {
      email: "user@example.com",
      password: "password123",
    },
    header: vi.fn((name: string) =>
      name.toLowerCase() === "x-request-id" ? "request-1" : undefined,
    ),
  }) as unknown as Request<Record<string, never>, unknown, {
    email?: string;
    password?: string;
  }>;

const mockedLoginAuthUser = vi.mocked(loginAuthUser);
const mockedLogoutAuthUser = vi.mocked(logoutAuthUser);
const mockedGetUserStateByUserId = vi.mocked(getUserStateByUserId);

describe("loginController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    mockedLoginAuthUser.mockResolvedValue({
      status: "success",
      message: "User logged in",
      data: {
        user: {
          id: "user-1",
          email: "user@example.com",
        },
        accessToken: "access-token",
        refreshToken: "refresh-token",
      },
    });
    mockedLogoutAuthUser.mockResolvedValue(undefined);
  });

  it("returns the auth response when the user state is active", async () => {
    const req = createLoginRequest();
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    mockedGetUserStateByUserId.mockResolvedValue({
      id_user: "user-1",
      role: "USER",
      statuts: "ACTIVE",
    });

    await loginController(req, res, next);

    expect(mockedLoginAuthUser).toHaveBeenCalledWith(
      {
        email: "user@example.com",
        password: "password123",
      },
      "request-1",
    );
    expect(mockedGetUserStateByUserId).toHaveBeenCalledWith(
      "user-1",
      "Bearer access-token",
      "request-1",
    );
    expect(mockedLogoutAuthUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "User logged in",
      data: {
        user: {
          id: "user-1",
          email: "user@example.com",
        },
        accessToken: "access-token",
        refreshToken: "refresh-token",
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks inactive users and revokes the issued refresh token", async () => {
    const req = createLoginRequest();
    const res = createResponse();
    const next = vi.fn() as NextFunction;

    mockedGetUserStateByUserId.mockResolvedValue({
      id_user: "user-1",
      role: "USER",
      statuts: "INACTIVE",
    });

    await loginController(req, res, next);

    expect(mockedLogoutAuthUser).toHaveBeenCalledWith(
      "Bearer access-token",
      "refresh-token",
      "request-1",
    );
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Your account has been suspended. Please contact a moderator or administrator.",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
