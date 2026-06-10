import "dotenv/config";

import app from "./app";
import { connectToDatabase, disconnectFromDatabase } from "./config/database";

const PORT = Number(process.env.PORT) || 3002;

const startDatabaseConnection = async (): Promise<void> => {
  try {
    await connectToDatabase();
    console.log("profile-service connected to MongoDB");
  } catch (error) {
    console.error("profile-service failed to connect to MongoDB", error);
  }
};

const startServer = (): void => {
  app.listen(PORT, () => {
    console.log(`profile-service running on http://localhost:${PORT}`);
  });

  void startDatabaseConnection();
};

const shutdown = async (): Promise<void> => {
  await disconnectFromDatabase();
  process.exit(0);
};

process.on("SIGINT", () => {
  void shutdown();
});

process.on("SIGTERM", () => {
  void shutdown();
});

startServer();
