import mongoose from "mongoose";
import { env } from "./env";
 
// Connexion à MongoDB via Mongoose
// On exporte la fonction pour pouvoir l'appeler depuis server.ts
export async function connectDatabase(): Promise<void> {
    await mongoose.connect(env.mongoUri);
    console.log("Connected to MongoDB");
}