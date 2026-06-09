export type RegisterInput = {
    email: string;
    passwordHash: string;
};

export type SafeUser = {
    id: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
};

export type LoginInput = {
    email: string;
    passwordHash: string;
};

export type AuthTokens = {
    accessToken: string;
    refreshToken: string;
};

export type RefreshTokenInput = {
    refreshToken: string;
};

export type RefreshTokenResponse = {
    accessToken: string;
    refreshToken: string;
};

export type PasswordUpdateInput = {
    currentPassword: string;
    newPassword: string;
};

export type AuthResponse = {
    user: SafeUser;
    tokens: AuthTokens;
};
