import { describe, expect, it } from "vitest";

import {
  createProfileSchema,
  profileParamsSchema,
  updateProfileSchema,
} from "../../../src/models/user-info.model";

describe("user-info.model schemas", () => {
  it("createProfileSchema trims fields and maps bibliography to bio", () => {
    const result = createProfileSchema.parse({
      id_user: " user-1 ",
      username: " alice ",
      bibliography: " hello ",
    });

    expect(result).toEqual({
      id_user: "user-1",
      username: "alice",
      nickname: "",
      bio: "hello",
      url_photo: "",
    });
  });

  it("createProfileSchema rejects inconsistent bio and bibliography", () => {
    const result = createProfileSchema.safeParse({
      id_user: "user-1",
      username: "alice",
      bio: "one",
      bibliography: "two",
    });

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["bibliography"],
          message: "bio and bibliography must match when both are provided",
        }),
      ]),
    );
  });

  it("updateProfileSchema trims provided fields and keeps undefined fields absent", () => {
    const result = updateProfileSchema.parse({
      username: " alice ",
      nickname: " ally ",
      bio: " hello ",
    });

    expect(result).toEqual({
      username: "alice",
      nickname: "ally",
      bio: "hello",
      url_photo: undefined,
    });
  });

  it("updateProfileSchema rejects an empty payload", () => {
    const result = updateProfileSchema.safeParse({});

    expect(result.success).toBe(false);

    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: "At least one field must be provided",
        }),
      ]),
    );
  });

  it("profileParamsSchema rejects a blank id_user", () => {
    const result = profileParamsSchema.safeParse({
      id_user: "   ",
    });

    expect(result.success).toBe(false);
  });
});
