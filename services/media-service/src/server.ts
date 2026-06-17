import app from "./app";
import { connectDatabase } from "./config/database";
import { ensureBucket } from "./config/minio";
import { env } from "./config/env";

// On démarre le serveur seulement quand MongoDB ET MinIO sont prêts
connectDatabase()
    .then(() => ensureBucket())
    .then(() => {
        app.listen(env.port, () => {
            console.log(`media-service running on http://localhost:${env.port}`);
        });
    })
    .catch((error) => {
        console.error("Startup failed:", error);
        process.exit(1);
    });