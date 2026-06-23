import * as Minio from "minio";
import { env } from "./env";

const publicMinioUrl = new URL(env.minio.publicUrl);
const normalizedPublicBasePath = publicMinioUrl.pathname.replace(/\/$/, "");

// Client MinIO — réutilisé dans tout le service
export const minioClient = new Minio.Client({
    endPoint: env.minio.endPoint,
    port: env.minio.port,
    useSSL: env.minio.useSSL,
    accessKey: env.minio.accessKey,
    secretKey: env.minio.secretKey,
});

export const publicMinioClient = new Minio.Client({
    endPoint: publicMinioUrl.hostname,
    port: publicMinioUrl.port
        ? Number(publicMinioUrl.port)
        : publicMinioUrl.protocol === "https:"
            ? 443
            : 80,
    useSSL: publicMinioUrl.protocol === "https:",
    region: "us-east-1",
    accessKey: env.minio.accessKey,
    secretKey: env.minio.secretKey,
});

export function toBrowserMinioUrl(url: string): string {
    const parsedUrl = new URL(url);

    if (normalizedPublicBasePath && !parsedUrl.pathname.startsWith(`${normalizedPublicBasePath}/`)) {
        parsedUrl.pathname = `${normalizedPublicBasePath}${parsedUrl.pathname}`;
    }

    return parsedUrl.toString();
}

export function buildPublicObjectUrl(bucket: string, objectKey: string): string {
    const encodedObjectKey = objectKey
        .split("/")
        .map((segment) => encodeURIComponent(segment))
        .join("/");

    return toBrowserMinioUrl(`${publicMinioUrl.origin}/${bucket}/${encodedObjectKey}`);
}

// Vérifie que le bucket existe, le crée sinon
export async function ensureBucket(): Promise<void> {
    const bucket = env.minio.bucket;
    const exists = await minioClient.bucketExists(bucket);

    if (!exists) {
        await minioClient.makeBucket(bucket);

        // Politique publique pour accéder aux fichiers sans auth
        const policy = JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Action: ["s3:GetObject"],
                    Resource: [`arn:aws:s3:::${bucket}/*`],
                },
            ],
        });

        await minioClient.setBucketPolicy(bucket, policy);
        console.log(`Bucket "${bucket}" créé avec accès public`);
    } else {
        console.log(`Bucket "${bucket}" trouvé`);
    }
}
