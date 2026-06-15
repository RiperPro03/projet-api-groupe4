import "dotenv/config";

import app from "./app.js";
import {
  connectToDatabase,
  disconnectFromDatabase,
} from "./config/database.js";

const PORT = process.env.PORT || 3007;

async function main() {
  await connectToDatabase();
  console.log("interaction-service connected to MongoDB");

  app.listen(PORT, () => {
    console.log(`interaction-service running on http://localhost:${PORT}`);
  });
}

async function shutdown() {
  await disconnectFromDatabase();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});

main().catch((error) => {
  console.error("interaction-service failed to start", error);
  process.exit(1);
});
