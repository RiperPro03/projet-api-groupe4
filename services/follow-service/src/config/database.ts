import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/breezy";

const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({ adapter });

export async function initDatabase(): Promise<void> {
  await prisma.$connect();
}

export default prisma;
