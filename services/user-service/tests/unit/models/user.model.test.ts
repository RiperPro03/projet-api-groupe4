import { describe, expect, it } from "vitest";

import {
  USER_STATE_ROLES,
  USER_STATE_STATUSES,
} from "../../../src/models/user.model";

describe("user.model", () => {
  it("exports the supported user roles", () => {
    expect(USER_STATE_ROLES).toEqual(["ADMIN", "MODERATOR", "USER"]);
  });

  it("exports the supported user statuses", () => {
    expect(USER_STATE_STATUSES).toEqual(["ACTIVE", "INACTIVE"]);
  });
});
