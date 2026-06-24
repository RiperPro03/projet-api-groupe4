ALTER TABLE "content_reports" ADD COLUMN "commentId" TEXT;

ALTER TABLE "content_reports" DROP CONSTRAINT "content_reports_target_check";

ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_target_check" CHECK (
    (
        "postId" IS NOT NULL
        AND "commentId" IS NULL
        AND "reportedUserId" IS NULL
    )
    OR (
        "postId" IS NULL
        AND "commentId" IS NOT NULL
        AND "reportedUserId" IS NULL
    )
    OR (
        "postId" IS NULL
        AND "commentId" IS NULL
        AND "reportedUserId" IS NOT NULL
    )
);
