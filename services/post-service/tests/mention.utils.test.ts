import { describe, expect, it } from "vitest";

import { extractMentionUsernames } from "../src/utils/mention.utils.js";

describe("mention.utils", () => {
  it("extrait les usernames mentionnés", () => {
    expect(extractMentionUsernames("Salut @alice et @bob_1")).toEqual([
      "alice",
      "bob_1",
    ]);
  });

  it("deduplique les mentions", () => {
    expect(extractMentionUsernames("@alice @ALICE @alice")).toEqual(["alice"]);
  });

  it("retourne une liste vide sans mention", () => {
    expect(extractMentionUsernames("Salut tout le monde")).toEqual([]);
  });
});
