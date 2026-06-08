-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MODERATOR', 'USER');

-- CreateEnum
CREATE TYPE "Statuts" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "users_state" (
    "id_user" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "statuts" "Statuts" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "users_state_pkey" PRIMARY KEY ("id_user")
);
