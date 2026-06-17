import * as Minio from "minio";
import { env } from "./env";

// Client MinIO — réutilisé dans tout le service
export const minioClient = new Minio.Client({
    endPoint: env.minio.endPoint,
    port: env.minio.port,
    useSSL: env.minio.useSSL,
    accessKey: env.minio.accessKey,
    secretKey: env.minio.secretKey,
});

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