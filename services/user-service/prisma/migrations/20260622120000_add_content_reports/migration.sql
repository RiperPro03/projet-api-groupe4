-- CreateTable
CREATE TABLE "content_reports" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "postId" TEXT,
    "reportedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "content_reports_target_check" CHECK (
        (
            "postId" IS NOT NULL
            AND "reportedUserId" IS NULL
        )
        OR (
            "postId" IS NULL
            AND "reportedUserId" IS NOT NULL
        )
    )
);
