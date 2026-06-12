import app from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";

// Pattern du workshop étape 4 :
// On démarre le serveur UNIQUEMENT après la connexion à la base de données.
// Si MongoDB est indisponible, le service ne doit pas tourner.

connectDatabase()
    .then(() => {
        app.listen(env.port, () => {
            console.log(`post-service running on http://localhost:${env.port}`);
        });
    })
    .catch((error) => {
        console.error("Failed to connect to MongoDB:", error);
        process.exit(1);
    });