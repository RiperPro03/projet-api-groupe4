import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("bcrypt", () => ({
    default: {
        hash: vi.fn(),
        compare: vi.fn(),
    },
}));

vi.mock("../../src/config/prisma", () => ({
    prisma: {
        user: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        refreshToken: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            updateMany: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}));

vi.mock("../../src/utils/token.util", () => ({
    generateAccessToken: vi.fn(),
    generateRefreshToken: vi.fn(),
    getRefreshTokenExpirationDate: vi.fn(),
    hashToken: vi.fn(),
}));

import bcrypt from "bcrypt";
import { prisma } from "../../src/config/prisma";
import authService from "../../src/services/auth.service";
import {
    generateAccessToken,
    generateRefreshToken,
    getRefreshTokenExpirationDate,
    hashToken,
} from "../../src/utils/token.util";

const mockedBcrypt = vi.mocked(bcrypt);
const mockedPrisma = vi.mocked(prisma, true);
const mockedGenerateAccessToken = vi.mocked(generateAccessToken);
const mockedGenerateRefreshToken = vi.mocked(generateRefreshToken);
const mockedGetRefreshTokenExpirationDate = vi.mocked(
    getRefreshTokenExpirationDate,
);
const mockedHashToken = vi.mocked(hashToken);

describe("auth.service", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Comportement par defaut des mocks : chaque dependance renvoie
        // une valeur stable pour que chaque test ne surcharge que son cas utile.
        mockedGenerateAccessToken.mockReturnValue("access-token");
        mockedGenerateRefreshToken.mockReturnValue("new-refresh-token");
        mockedGetRefreshTokenExpirationDate.mockReturnValue(
            new Date("2030-01-01T00:00:00.000Z"),
        );
        mockedHashToken.mockImplementation((value) => `hashed-${value}`);
        mockedPrisma.$transaction.mockResolvedValue([] as never);
    });

    it("registerUser rejects an email that already exists", async () => {
        mockedPrisma.user.findUnique.mockResolvedValue({
            id: "user-1",
            email: "user@example.com",
            passwordHash: "hashed-password",
            createdAt: new Date(),
            updatedAt: new Date(),
        } as never);

        await expect(
            authService.registerUser({
                email: "user@example.com",
                passwordHash: "password123",
            }),
        ).rejects.toThrow("EMAIL_ALREADY_USED");
    });

    it("registerUser hashes the password and returns a sanitized user", async () => {
        const createdAt = new Date("2025-01-01T00:00:00.000Z");
        const updatedAt = new Date("2025-01-02T00:00:00.000Z");

        mockedPrisma.user.findUnique.mockResolvedValue(null);
        mockedBcrypt.hash.mockResolvedValue("hashed-password" as never);
        mockedPrisma.user.create.mockResolvedValue({
            id: "user-1",
            email: "user@example.com",
            createdAt,
            updatedAt,
        } as never);

        const result = await authService.registerUser({
            email: " User@Example.com ",
            passwordHash: "password123",
        });

        expect(mockedBcrypt.hash).toHaveBeenCalledWith("password123", 10);
        expect(mockedPrisma.user.create).toHaveBeenCalledWith({
            data: {
                email: "user@example.com",
                passwordHash: "hashed-password",
            },
            select: {
                id: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        expect(result).toEqual({
            id: "user-1",
            email: "user@example.com",
            createdAt,
            updatedAt,
        });
    });

    it("listUsers returns only sanitized users ordered by most recent", async () => {
        const users = [
            {
                id: "user-2",
                email: "user2@example.com",
                createdAt: new Date("2025-01-03T00:00:00.000Z"),
                updatedAt: new Date("2025-01-04T00:00:00.000Z"),
            },
        ];

        mockedPrisma.user.findMany.mockResolvedValue(users as never);

        const result = await authService.listUsers();

        expect(mockedPrisma.user.findMany).toHaveBeenCalledWith({
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        expect(result).toEqual(users);
    });

    it("getUserById returns null when the user does not exist", async () => {
        mockedPrisma.user.findUnique.mockResolvedValue(null);

        const result = await authService.getUserById("missing-user");

        expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
            where: {
                id: "missing-user",
            },
            select: {
                id: true,
                email: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        expect(result).toBeNull();
    });

    it("loginUser rejects invalid credentials when the user does not exist", async () => {
        mockedPrisma.user.findUnique.mockResolvedValue(null);

        await expect(
            authService.loginUser({
                email: "user@example.com",
                passwordHash: "password123",
            }),
        ).rejects.toThrow("INVALID_CREDENTIALS");
    });

    it("loginUser returns tokens and stores only the refresh token hash", async () => {
        const user = {
            id: "user-1",
            email: "user@example.com",
            passwordHash: "hashed-password",
            createdAt: new Date("2025-01-01T00:00:00.000Z"),
            updatedAt: new Date("2025-01-02T00:00:00.000Z"),
        };

        mockedPrisma.user.findUnique.mockResolvedValue(user as never);
        mockedBcrypt.compare.mockResolvedValue(true as never);
        mockedGenerateAccessToken.mockReturnValue("access-token");
        mockedGenerateRefreshToken.mockReturnValue("refresh-token");

        const result = await authService.loginUser({
            email: "USER@example.com",
            passwordHash: "password123",
        });

        // Le service ne doit jamais stocker le refresh token en clair en base.
        expect(mockedBcrypt.compare).toHaveBeenCalledWith(
            "password123",
            "hashed-password",
        );
        expect(mockedHashToken).toHaveBeenCalledWith("refresh-token");
        expect(mockedPrisma.refreshToken.create).toHaveBeenCalledWith({
            data: {
                tokenHash: "hashed-refresh-token",
                userId: "user-1",
                expiresAt: new Date("2030-01-01T00:00:00.000Z"),
            },
        });
        expect(result).toEqual({
            user: {
                id: "user-1",
                email: "user@example.com",
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            tokens: {
                accessToken: "access-token",
                refreshToken: "refresh-token",
            },
        });
    });

    it("refreshAccessToken rejects an empty refresh token", async () => {
        await expect(
            authService.refreshAccessToken({ refreshToken: "" }),
        ).rejects.toThrow("REFRESH_TOKEN_REQUIRED");
    });

    it("refreshAccessToken rejects an unknown refresh token", async () => {
        mockedPrisma.refreshToken.findUnique.mockResolvedValue(null);

        await expect(
            authService.refreshAccessToken({
                refreshToken: "missing-refresh-token",
            }),
        ).rejects.toThrow("INVALID_REFRESH_TOKEN");
    });

    it("refreshAccessToken rejects a revoked refresh token", async () => {
        mockedPrisma.refreshToken.findUnique.mockResolvedValue({
            id: "token-1",
            tokenHash: "hashed-current-token",
            userId: "user-1",
            expiresAt: new Date("2030-01-01T00:00:00.000Z"),
            revokedAt: new Date("2025-01-03T00:00:00.000Z"),
            createdAt: new Date("2025-01-01T00:00:00.000Z"),
        } as never);

        await expect(
            authService.refreshAccessToken({ refreshToken: "current-token" }),
        ).rejects.toThrow("REFRESH_TOKEN_REVOKED");
    });

    it("refreshAccessToken rejects an expired refresh token", async () => {
        mockedPrisma.refreshToken.findUnique.mockResolvedValue({
            id: "token-1",
            tokenHash: "hashed-current-token",
            userId: "user-1",
            expiresAt: new Date("2020-01-01T00:00:00.000Z"),
            revokedAt: null,
            createdAt: new Date("2019-01-01T00:00:00.000Z"),
        } as never);

        await expect(
            authService.refreshAccessToken({ refreshToken: "current-token" }),
        ).rejects.toThrow("REFRESH_TOKEN_EXPIRED");
    });

    it("refreshAccessToken rejects when the linked user no longer exists", async () => {
        mockedPrisma.refreshToken.findUnique.mockResolvedValue({
            id: "token-1",
            tokenHash: "hashed-current-token",
            userId: "user-1",
            expiresAt: new Date("2030-01-01T00:00:00.000Z"),
            revokedAt: null,
            createdAt: new Date("2025-01-01T00:00:00.000Z"),
        } as never);
        mockedPrisma.user.findUnique.mockResolvedValue(null);

        await expect(
            authService.refreshAccessToken({ refreshToken: "current-token" }),
        ).rejects.toThrow("USER_NOT_FOUND");
    });

    it("refreshAccessToken rotates the refresh token and returns new tokens", async () => {
        const expiresAt = new Date("2030-02-01T00:00:00.000Z");

        mockedPrisma.refreshToken.findUnique.mockResolvedValue({
            id: "token-1",
            tokenHash: "hashed-current-token",
            userId: "user-1",
            expiresAt,
            revokedAt: null,
            createdAt: new Date("2025-01-01T00:00:00.000Z"),
        } as never);
        mockedPrisma.user.findUnique.mockResolvedValue({
            id: "user-1",
            email: "user@example.com",
            passwordHash: "hashed-password",
            createdAt: new Date("2025-01-01T00:00:00.000Z"),
            updatedAt: new Date("2025-01-02T00:00:00.000Z"),
        } as never);
        mockedGenerateAccessToken.mockReturnValue("rotated-access-token");
        mockedGenerateRefreshToken.mockReturnValue("rotated-refresh-token");
        mockedPrisma.refreshToken.update.mockResolvedValue({
            id: "token-1",
            tokenHash: "hashed-current-token",
            userId: "user-1",
            expiresAt,
            revokedAt: new Date("2025-01-03T00:00:00.000Z"),
            createdAt: new Date("2025-01-01T00:00:00.000Z"),
        } as never);
        mockedPrisma.refreshToken.create.mockResolvedValue({
            id: "token-2",
            tokenHash: "hashed-rotated-refresh-token",
            userId: "user-1",
            expiresAt: new Date("2030-01-01T00:00:00.000Z"),
            revokedAt: null,
            createdAt: new Date("2025-01-03T00:00:00.000Z"),
        } as never);

        const result = await authService.refreshAccessToken({
            refreshToken: "current-token",
        });

        // Premier hash : recherche du token recu. Deuxieme hash : stockage du nouveau token.
        expect(mockedHashToken).toHaveBeenNthCalledWith(1, "current-token");
        expect(mockedHashToken).toHaveBeenNthCalledWith(
            2,
            "rotated-refresh-token",
        );
        // La rotation revoque l'ancien token et stocke le nouveau hash dans une transaction.
        expect(mockedGenerateAccessToken).toHaveBeenCalledWith({
            sub: "user-1",
            email: "user@example.com",
        });
        expect(mockedPrisma.refreshToken.update).toHaveBeenCalledWith({
            where: {
                id: "token-1",
            },
            data: {
                revokedAt: expect.any(Date),
            },
        });
        expect(mockedPrisma.refreshToken.create).toHaveBeenCalledWith({
            data: {
                tokenHash: "hashed-rotated-refresh-token",
                userId: "user-1",
                expiresAt: new Date("2030-01-01T00:00:00.000Z"),
            },
        });
        expect(mockedPrisma.$transaction).toHaveBeenCalledOnce();
        expect(result).toEqual({
            accessToken: "rotated-access-token",
            refreshToken: "rotated-refresh-token",
        });
    });

    it("logoutUser rejects an empty refresh token", async () => {
        await expect(
            authService.logoutUser("user-1", ""),
        ).rejects.toThrow("REFRESH_TOKEN_REQUIRED");
    });

    it("logoutUser rejects an unknown refresh token", async () => {
        mockedPrisma.refreshToken.findUnique.mockResolvedValue(null);

        await expect(
            authService.logoutUser("user-1", "missing-refresh-token"),
        ).rejects.toThrow("INVALID_REFRESH_TOKEN");
    });

    it("logoutUser rejects a refresh token that belongs to another user", async () => {
        mockedPrisma.refreshToken.findUnique.mockResolvedValue({
            id: "token-1",
            tokenHash: "hashed-refresh-token",
            userId: "user-2",
            expiresAt: new Date("2030-01-01T00:00:00.000Z"),
            revokedAt: null,
            createdAt: new Date("2025-01-01T00:00:00.000Z"),
        } as never);

        await expect(
            authService.logoutUser("user-1", "refresh-token"),
        ).rejects.toThrow("REFRESH_TOKEN_USER_MISMATCH");
    });

    it("logoutUser rejects a refresh token that is already revoked", async () => {
        mockedPrisma.refreshToken.findUnique.mockResolvedValue({
            id: "token-1",
            tokenHash: "hashed-refresh-token",
            userId: "user-1",
            expiresAt: new Date("2030-01-01T00:00:00.000Z"),
            revokedAt: new Date("2025-01-03T00:00:00.000Z"),
            createdAt: new Date("2025-01-01T00:00:00.000Z"),
        } as never);

        await expect(
            authService.logoutUser("user-1", "refresh-token"),
        ).rejects.toThrow("REFRESH_TOKEN_ALREADY_REVOKED");
    });

    it("logoutUser hashes the refresh token and revokes it logically", async () => {
        mockedPrisma.refreshToken.findUnique.mockResolvedValue({
            id: "token-1",
            tokenHash: "hashed-refresh-token",
            userId: "user-1",
            expiresAt: new Date("2030-01-01T00:00:00.000Z"),
            revokedAt: null,
            createdAt: new Date("2025-01-01T00:00:00.000Z"),
        } as never);
        mockedPrisma.refreshToken.update.mockResolvedValue({
            id: "token-1",
            tokenHash: "hashed-refresh-token",
            userId: "user-1",
            expiresAt: new Date("2030-01-01T00:00:00.000Z"),
            revokedAt: new Date("2025-01-03T00:00:00.000Z"),
            createdAt: new Date("2025-01-01T00:00:00.000Z"),
        } as never);

        await authService.logoutUser("user-1", "refresh-token");

        expect(mockedHashToken).toHaveBeenCalledWith("refresh-token");
        expect(mockedPrisma.refreshToken.findUnique).toHaveBeenCalledWith({
            where: {
                tokenHash: "hashed-refresh-token",
            },
        });
        expect(mockedPrisma.refreshToken.update).toHaveBeenCalledWith({
            where: {
                id: "token-1",
            },
            data: {
                revokedAt: expect.any(Date),
            },
        });
    });

    it("updatePassword rejects when the user does not exist", async () => {
        mockedPrisma.user.findUnique.mockResolvedValue(null);

        await expect(
            authService.updatePassword(
                "missing-user",
                "current-password",
                "new-password-123",
            ),
        ).rejects.toThrow("USER_NOT_FOUND");
    });

    it("updatePassword rejects an invalid current password", async () => {
        mockedPrisma.user.findUnique.mockResolvedValue({
            id: "user-1",
            email: "user@example.com",
            passwordHash: "hashed-password",
            createdAt: new Date("2025-01-01T00:00:00.000Z"),
            updatedAt: new Date("2025-01-02T00:00:00.000Z"),
        } as never);
        mockedBcrypt.compare.mockResolvedValue(false as never);

        await expect(
            authService.updatePassword(
                "user-1",
                "wrong-password",
                "new-password-123",
            ),
        ).rejects.toThrow("INVALID_CURRENT_PASSWORD");
    });

    it("updatePassword hashes the new password and revokes active refresh tokens", async () => {
        mockedPrisma.user.findUnique.mockResolvedValue({
            id: "user-1",
            email: "user@example.com",
            passwordHash: "hashed-password",
            createdAt: new Date("2025-01-01T00:00:00.000Z"),
            updatedAt: new Date("2025-01-02T00:00:00.000Z"),
        } as never);
        mockedBcrypt.compare.mockResolvedValue(true as never);
        mockedBcrypt.hash.mockResolvedValue("hashed-new-password" as never);
        mockedPrisma.user.update.mockResolvedValue({
            id: "user-1",
            email: "user@example.com",
            passwordHash: "hashed-new-password",
            createdAt: new Date("2025-01-01T00:00:00.000Z"),
            updatedAt: new Date("2025-01-03T00:00:00.000Z"),
        } as never);
        mockedPrisma.refreshToken.updateMany.mockResolvedValue({
            count: 2,
        } as never);

        await authService.updatePassword(
            "user-1",
            "current-password",
            "new-password-123",
        );

        expect(mockedBcrypt.compare).toHaveBeenCalledWith(
            "current-password",
            "hashed-password",
        );
        expect(mockedBcrypt.hash).toHaveBeenCalledWith("new-password-123", 10);
        expect(mockedPrisma.user.update).toHaveBeenCalledWith({
            where: {
                id: "user-1",
            },
            data: {
                passwordHash: "hashed-new-password",
            },
        });
        expect(mockedPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
            where: {
                userId: "user-1",
                revokedAt: null,
            },
            data: {
                revokedAt: expect.any(Date),
            },
        });
    });
});
