export type RegisterInput = {
    email: string;
    password: string;
};

export type SafeUser = {
    id: string;
    email: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
};

export type LoginInput = {
    email: string;
    password: string;
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

export type AuthResponse = {
    user: SafeUser;
    tokens: AuthTokens;
};
