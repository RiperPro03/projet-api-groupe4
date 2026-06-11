import mongoose from "mongoose";

import { env } from "./env.js";

export const connectToDatabase = async (): Promise<void> => {
  await mongoose.connect(env.mongoUri);
};

export const disconnectFromDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

export const getDatabaseStatus = (): string => {
  const states: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return states[mongoose.connection.readyState] ?? "unknown";
};

export const checkDatabaseHealth = async (): Promise<boolean> => {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    return false;
  }

  await mongoose.connection.db.admin().ping();
  return true;
};
