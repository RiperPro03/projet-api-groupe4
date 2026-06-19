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
