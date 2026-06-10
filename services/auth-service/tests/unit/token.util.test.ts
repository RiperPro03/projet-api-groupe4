import { describe, expect, it } from "vitest";
import {
    generateAccessToken,
    generateRefreshToken,
    getRefreshTokenExpirationDate,
    hashToken,
    verifyAccessToken,
} from "../../src/utils/token.util";

describe("token.util", () => {
    it("generates an access token that can be verified with the expected payload", () => {
        const payload = {
            sub: "user-123",
            email: "user@example.com",
            role: "admin",
        };

        const token = generateAccessToken(payload);
        const decoded = verifyAccessToken(token);

        // On verifie a la fois la validite du token et les champs utiles au middleware.
        expect(token).toEqual(expect.any(String));
        expect(decoded.sub).toBe(payload.sub);
        expect(decoded.email).toBe(payload.email);
    });

    it("generates a refresh token as a sufficiently long string", () => {
        const refreshToken = generateRefreshToken();

        expect(refreshToken).toEqual(expect.any(String));
        expect(refreshToken.length).toBeGreaterThanOrEqual(128);
    });

    it("hashes a token without returning the plain token and keeps a fixed length", () => {
        const token = "plain-refresh-token";
        const hashedToken = hashToken(token);

        // Le hash SHA-256 renvoye doit masquer la valeur d'origine et garder une taille stable.
        expect(hashedToken).not.toBe(token);
        expect(hashedToken).toHaveLength(64);
    });

    it("returns a refresh token expiration date in the future", () => {
        const expiresAt = getRefreshTokenExpirationDate();

        // Le refresh token doit toujours etre cree avec une date d'expiration future.
        expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
});
