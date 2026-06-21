import "dotenv/config";

import app from "./app.js";
import {
  connectToDatabase,
  disconnectFromDatabase,
} from "./config/database.js";
import { env } from "./config/env.js";

async function main() {
  await connectToDatabase();
  console.log("notification-service connected to MongoDB");

  app.listen(env.port, () => {
    console.log(
      `notification-service running on http://localhost:${env.port}`
    );
  });
}

async function shutdown() {
  await disconnectFromDatabase();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

main().catch((error) => {
  console.error("Failed to start notification-service:", error);
  process.exit(1);
});
