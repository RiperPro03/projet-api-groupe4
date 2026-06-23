import { describe, expect, it } from "vitest";

import {
  extractIndividualMentionUsernames,
  extractMentionUsernames,
  extractRoleMentions,
} from "../src/utils/mention.utils.js";

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

  it("detecte les mentions de groupe admin et moderator", () => {
    expect(extractRoleMentions("Salut @admin et @moderator")).toEqual([
      "ADMIN",
      "MODERATOR",
    ]);
  });

  it("deduplique les mentions de groupe", () => {
    expect(extractRoleMentions("@admin @ADMIN @admins")).toEqual(["ADMIN"]);
  });

  it("exclut les tokens de groupe des mentions individuelles", () => {
    expect(
      extractIndividualMentionUsernames("Salut @alice @admin @moderator"),
    ).toEqual(["alice"]);
  });
});
