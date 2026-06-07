import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5432/breezy",
  {
    dialect: "postgres",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
  }
);

export async function initDatabase(): Promise<void> {
  await sequelize.authenticate();
  await import("../models/follow.model.js");
  await sequelize.sync();
}

export default sequelize;
