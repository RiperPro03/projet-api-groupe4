-- CreateTable
CREATE TABLE IF NOT EXISTS "follows" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "follower_id" VARCHAR(255) NOT NULL,
    "following_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "follows_follower_id_following_id_key" ON "follows"("follower_id", "following_id");
