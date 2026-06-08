import "dotenv/config";
import app from "./app.js";
import { initDatabase } from "./config/database.js";

const PORT = process.env.PORT || 3004;

async function start() {
  try {
    // Les migrations sont appliquées par le script npm (dev/start), pas ici.
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`follow-service running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start follow-service:", error);
    process.exit(1);
  }
}

start();
