import type { Response } from "express";
import { vi } from "vitest";

export type MockResponse = Response & {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
};

export const createMockResponse = (): MockResponse => {
  const response = {} as MockResponse;

  response.status = vi.fn((statusCode: number) => {
    response.statusCode = statusCode;
    return response;
  }) as MockResponse["status"];

  response.json = vi.fn((body: unknown) => {
    response.locals.body = body;
    return response;
  }) as MockResponse["json"];

  response.locals = {};

  return response;
};
