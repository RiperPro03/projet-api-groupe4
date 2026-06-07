import "dotenv/config";

const requiredEnv = (key: string): string => {
    const value = process.env[key];

    if (!value) {
        throw new Error(`Missing environment variable: ${key}`);
    }

    return value;
};

export const env = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || 3001),

    databaseUrl: requiredEnv("DATABASE_URL"),

    jwt: {
        accessSecret: requiredEnv("JWT_ACCESS_SECRET"),
        refreshSecret: requiredEnv("JWT_REFRESH_SECRET"),
        accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    },
};