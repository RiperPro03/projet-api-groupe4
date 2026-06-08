import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

// Prisma 7 : la connexion PostgreSQL passe par un driver adapter (pg).
const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/breezy";

const adapter = new PrismaPg({ connectionString });

// Instance unique partagée par tout le service (pattern singleton).
const prisma = new PrismaClient({ adapter });

/** Vérifie que PostgreSQL est joignable avant d'accepter des requêtes HTTP. */
export async function initDatabase(): Promise<void> {
  await prisma.$connect();
}

export default prisma;
