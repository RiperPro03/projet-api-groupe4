import "dotenv/config";

const requiredEnv = (key: string): string => {
    const value = process.env[key];
    if (!value) throw new Error(`Missing environment variable: ${key}`);
    return value;
};

export const env = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || 3005),
    mongoUri: requiredEnv("MONGO_URI"),

    minio: {
        endPoint: requiredEnv("MINIO_ENDPOINT"),       // "minio" dans Docker, "localhost" en local
        port: Number(process.env.MINIO_PORT || 9000),
        useSSL: process.env.MINIO_USE_SSL === "true",
        accessKey: requiredEnv("MINIO_ACCESS_KEY"),
        secretKey: requiredEnv("MINIO_SECRET_KEY"),
        bucket: process.env.MINIO_BUCKET || "breezy-media",
        publicUrl: requiredEnv("MINIO_PUBLIC_URL"),    // URL publique pour construire les liens
    },
};