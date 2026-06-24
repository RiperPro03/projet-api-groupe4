"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ActionIcon,
  Badge,
  Card,
  Group,
  Loader,
  Modal,
  ScrollArea,
  SegmentedControl,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  FiArrowLeft,
  FiExternalLink,
  FiFileMinus,
  FiFileText,
  FiFlag,
  FiMessageCircle,
  FiRefreshCw,
  FiTrash2,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import { deleteComment, fetchCommentById } from "@/lib/api/comment.service";
import { getApiErrorMessage } from "@/lib/api/http-client";
import { deletePost } from "@/lib/api/post.service";
import { getProfileById, type PublicProfile } from "@/lib/api/profile.service";
import {
  deleteContentReport,
  getContentReports,
  type ContentReport,
} from "@/lib/api/report.service";
import { useI18n } from "@/lib/i18n/client";
import { RippleButton } from "@/components/ui/ripple-button";

type ReportFilter = "all" | "posts" | "comments" | "users";

const secondaryButtonClassName =
  "rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60";
const destructiveButtonClassName =
  "rounded-full border-0 bg-destructive px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-destructive/20 transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60";

function getReportTargetType(report: ContentReport) {
  if (report.reportedUserId) {
    return "user";
  }

  if (report.commentId) {
    return "comment";
  }

  return "post";
}

export function AdminReportsTable() {
  const { dateLocale, t } = useI18n();
  const { notify } = useNotifications();
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [reportedProfiles, setReportedProfiles] = useState<
    Map<string, PublicProfile>
  >(() => new Map());
  const [commentPostIds, setCommentPostIds] = useState<Map<string, string>>(
    () => new Map()
  );
  const [filter, setFilter] = useState<ReportFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingReportIds, setDeletingReportIds] = useState<Set<string>>(
    () => new Set()
  );
  const [deletingPostIds, setDeletingPostIds] = useState<Set<string>>(
    () => new Set()
  );
  const [deletingCommentIds, setDeletingCommentIds] = useState<Set<string>>(
    () => new Set()
  );
  const [postDeleteReport, setPostDeleteReport] =
    useState<ContentReport | null>(null);
  const [commentDeleteReport, setCommentDeleteReport] =
    useState<ContentReport | null>(null);
  const requestIdRef = useRef(0);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(dateLocale, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [dateLocale]
  );

  const visibleReports = reports.filter((report) => {
    if (filter === "posts") {
      return Boolean(report.postId);
    }

    if (filter === "comments") {
      return Boolean(report.commentId);
    }

    if (filter === "users") {
      return Boolean(report.reportedUserId);
    }

    return true;
  });

  const loadReports = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);
    setError(null);

    try {
      const nextReports = await getContentReports();
      const reportedUserIds = Array.from(
        new Set(
          nextReports
            .map((report) => report.reportedUserId)
            .filter((userId): userId is string => Boolean(userId))
        )
      );
      const reportedCommentIds = Array.from(
        new Set(
          nextReports
            .map((report) => report.commentId)
            .filter((commentId): commentId is string => Boolean(commentId))
        )
      );
      const profileEntries = await Promise.all(
        reportedUserIds.map(async (userId) => {
          const profile = await getProfileById(userId).catch(() => null);
          return profile ? ([userId, profile] as const) : null;
        })
      );
      const commentPostEntries = await Promise.all(
        reportedCommentIds.map(async (commentId) => {
          const comment = await fetchCommentById(commentId).catch(() => null);
          return comment ? ([commentId, comment.id_post] as const) : null;
        })
      );
      const resolvedProfileEntries = profileEntries.filter(
        (entry): entry is readonly [string, PublicProfile] => entry !== null
      );
      const resolvedCommentPostEntries = commentPostEntries.filter(
        (entry): entry is readonly [string, string] => entry !== null
      );

      if (requestIdRef.current === requestId) {
        setReports(nextReports);
        setReportedProfiles(new Map(resolvedProfileEntries));
        setCommentPostIds(new Map(resolvedCommentPostEntries));
      }
    } catch (loadError) {
      if (requestIdRef.current === requestId) {
        setReports([]);
        setReportedProfiles(new Map());
        setCommentPostIds(new Map());
        setError(getApiErrorMessage(loadError, t("admin.reportLoadError")));
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [t]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadReports();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [loadReports]);

  const handleDeleteReport = async (report: ContentReport) => {
    setDeletingReportIds((current) => new Set(current).add(report.id));

    try {
      await deleteContentReport(report.id);
      setReports((currentReports) =>
        currentReports.filter((currentReport) => currentReport.id !== report.id)
      );
      notify(
        {
          title: t("admin.reportDeleteSuccessTitle"),
          description: t("admin.reportDeleteSuccessDescription"),
          tone: "success",
        },
        { duration: 2500 }
      );
    } catch (deleteError) {
      notify(
        {
          title: t("admin.reportDeleteErrorTitle"),
          description: getApiErrorMessage(
            deleteError,
            t("admin.reportDeleteError")
          ),
          tone: "error",
        },
        { duration: 3500 }
      );
    } finally {
      setDeletingReportIds((current) => {
        const next = new Set(current);
        next.delete(report.id);
        return next;
      });
    }
  };

  const handleDeleteReportedPost = async (report: ContentReport) => {
    if (!report.postId) {
      return;
    }

    const postId = report.postId;
    setDeletingPostIds((current) => new Set(current).add(postId));

    try {
      await deletePost(postId);
      const relatedReportIds = Array.from(
        new Set([
          report.id,
          ...reports
            .filter((currentReport) => currentReport.postId === postId)
            .map((currentReport) => currentReport.id),
        ])
      );

      await Promise.all(
        relatedReportIds.map((reportId) =>
          deleteContentReport(reportId).catch(() => null)
        )
      );
      setReports((currentReports) =>
        currentReports.filter((currentReport) => currentReport.postId !== postId)
      );
      notify(
        {
          title: t("admin.reportPostDeleteSuccessTitle"),
          description: t("admin.reportPostDeleteSuccessDescription"),
          tone: "success",
        },
        { duration: 2500 }
      );
    } catch (deleteError) {
      notify(
        {
          title: t("admin.reportPostDeleteErrorTitle"),
          description: getApiErrorMessage(
            deleteError,
            t("admin.reportPostDeleteError")
          ),
          tone: "error",
        },
        { duration: 3500 }
      );
    } finally {
      setDeletingPostIds((current) => {
        const next = new Set(current);
        next.delete(postId);
        return next;
      });
    }
  };

  const handleDeleteReportedComment = async (report: ContentReport) => {
    if (!report.commentId) {
      return;
    }

    const commentId = report.commentId;
    setDeletingCommentIds((current) => new Set(current).add(commentId));

    try {
      await deleteComment(commentId);
      const relatedReportIds = Array.from(
        new Set([
          report.id,
          ...reports
            .filter((currentReport) => currentReport.commentId === commentId)
            .map((currentReport) => currentReport.id),
        ])
      );

      await Promise.all(
        relatedReportIds.map((reportId) =>
          deleteContentReport(reportId).catch(() => null)
        )
      );
      setReports((currentReports) =>
        currentReports.filter(
          (currentReport) => currentReport.commentId !== commentId
        )
      );
      notify(
        {
          title: t("admin.reportCommentDeleteSuccessTitle"),
          description: t("admin.reportCommentDeleteSuccessDescription"),
          tone: "success",
        },
        { duration: 2500 }
      );
    } catch (deleteError) {
      notify(
        {
          title: t("admin.reportCommentDeleteErrorTitle"),
          description: getApiErrorMessage(
            deleteError,
            t("admin.reportCommentDeleteError")
          ),
          tone: "error",
        },
        { duration: 3500 }
      );
    } finally {
      setDeletingCommentIds((current) => {
        const next = new Set(current);
        next.delete(commentId);
        return next;
      });
    }
  };

  const handleConfirmDeleteReportedPost = async () => {
    if (!postDeleteReport) {
      return;
    }

    await handleDeleteReportedPost(postDeleteReport);
    setPostDeleteReport(null);
  };

  const handleConfirmDeleteReportedComment = async () => {
    if (!commentDeleteReport) {
      return;
    }

    await handleDeleteReportedComment(commentDeleteReport);
    setCommentDeleteReport(null);
  };

  const pendingPostId = postDeleteReport?.postId ?? null;
  const isDeletingPendingPost = pendingPostId
    ? deletingPostIds.has(pendingPostId)
    : false;
  const pendingCommentId = commentDeleteReport?.commentId ?? null;
  const isDeletingPendingComment = pendingCommentId
    ? deletingCommentIds.has(pendingCommentId)
    : false;

  return (
    <section id="admin-reports" className="scroll-mt-24">
      <Modal
        opened={postDeleteReport !== null}
        onClose={() => {
          if (!isDeletingPendingPost) {
            setPostDeleteReport(null);
          }
        }}
        title={t("admin.reportDeletePostAria")}
        centered
        radius={8}
        closeOnClickOutside={!isDeletingPendingPost}
        closeOnEscape={!isDeletingPendingPost}
        overlayProps={{ backgroundOpacity: 0.72, blur: 2 }}
      >
        <Stack gap="md">
          <Stack gap={4}>
            <Text size="sm" style={{ color: "var(--muted-foreground)" }}>
              {t("post.deleteDescription")}
            </Text>
            {pendingPostId && (
              <Text size="xs" style={{ color: "var(--muted-foreground)" }}>
                {t("admin.reportPostTarget", { postId: pendingPostId })}
              </Text>
            )}
          </Stack>

          <Group justify="flex-end">
            <RippleButton
              type="button"
              rippleColor="var(--foreground)"
              disabled={isDeletingPendingPost}
              onClick={() => setPostDeleteReport(null)}
              className={secondaryButtonClassName}
            >
              {t("common.cancel")}
            </RippleButton>
            <RippleButton
              type="button"
              rippleColor="var(--foreground)"
              disabled={isDeletingPendingPost}
              onClick={() => void handleConfirmDeleteReportedPost()}
              className={destructiveButtonClassName}
            >
              <span className="flex items-center gap-2">
                <FiTrash2 size={16} />
                {isDeletingPendingPost ? t("post.deleting") : t("common.delete")}
              </span>
            </RippleButton>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={commentDeleteReport !== null}
        onClose={() => {
          if (!isDeletingPendingComment) {
            setCommentDeleteReport(null);
          }
        }}
        title={t("admin.reportDeleteCommentAria")}
        centered
        radius={8}
        closeOnClickOutside={!isDeletingPendingComment}
        closeOnEscape={!isDeletingPendingComment}
        overlayProps={{ backgroundOpacity: 0.72, blur: 2 }}
      >
        <Stack gap="md">
          <Stack gap={4}>
            <Text size="sm" style={{ color: "var(--muted-foreground)" }}>
              {t("comment.deleteDescription")}
            </Text>
            {pendingCommentId && (
              <Text size="xs" style={{ color: "var(--muted-foreground)" }}>
                {t("admin.reportCommentTarget", { commentId: pendingCommentId })}
              </Text>
            )}
          </Stack>

          <Group justify="flex-end">
            <RippleButton
              type="button"
              rippleColor="var(--foreground)"
              disabled={isDeletingPendingComment}
              onClick={() => setCommentDeleteReport(null)}
              className={secondaryButtonClassName}
            >
              {t("common.cancel")}
            </RippleButton>
            <RippleButton
              type="button"
              rippleColor="var(--foreground)"
              disabled={isDeletingPendingComment}
              onClick={() => void handleConfirmDeleteReportedComment()}
              className={destructiveButtonClassName}
            >
              <span className="flex items-center gap-2">
                <FiTrash2 size={16} />
                {isDeletingPendingComment
                  ? t("comment.deleting")
                  : t("common.delete")}
              </span>
            </RippleButton>
          </Group>
        </Stack>
      </Modal>

      <Group justify="space-between" align="flex-start" gap="md" mb="lg">
        <Stack gap={4}>
          <Text component="h1" fw={700} size="xl" style={{ color: "var(--foreground)" }}>
            {t("admin.reportTitle")}
          </Text>
          <Text size="sm" style={{ color: "var(--muted-foreground)" }}>
            {t("admin.reportDescription")}
          </Text>
        </Stack>
        <Group gap="sm">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground outline-none transition-colors hover:border-breezy-green hover:text-breezy-green focus-visible:ring-2 focus-visible:ring-breezy-green"
          >
            <FiArrowLeft className="h-4 w-4" aria-hidden />
            {t("admin.backDashboard")}
          </Link>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground outline-none transition-colors hover:border-breezy-green hover:text-breezy-green focus-visible:ring-2 focus-visible:ring-breezy-green"
          >
            <FiUsers className="h-4 w-4" aria-hidden />
            {t("admin.overviewUsersTitle")}
          </Link>
          <Badge
            variant="light"
            color="red"
            radius={8}
            size="lg"
            className="shrink-0"
          >
            {t("admin.reportCount", { count: reports.length })}
          </Badge>
          <Tooltip label={t("admin.reportRefresh")}>
            <ActionIcon
              type="button"
              variant="subtle"
              color="green"
              radius="xl"
              aria-label={t("admin.reportRefresh")}
              onClick={() => void loadReports()}
              disabled={loading}
            >
              {loading ? <Loader size="xs" /> : <FiRefreshCw size={18} />}
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <SegmentedControl
        mb="md"
        value={filter}
        onChange={(value) => setFilter(value as ReportFilter)}
        data={[
          { value: "all", label: t("admin.reportFilterAll") },
          { value: "posts", label: t("admin.reportFilterPosts") },
          { value: "comments", label: t("admin.reportFilterComments") },
          { value: "users", label: t("admin.reportFilterUsers") },
        ]}
      />

      {loading && (
        <Group justify="center" py="xl">
          <Loader color="green" />
        </Group>
      )}

      {error && !loading && (
        <Card radius={8} p="md" withBorder style={{ borderColor: "var(--destructive)" }}>
          <Text size="sm" style={{ color: "var(--destructive)" }}>
            {error}
          </Text>
        </Card>
      )}

      {!loading && !error && visibleReports.length === 0 && (
        <Stack align="center" gap="xs" py={56}>
          <FiFlag
            className="h-10 w-10 opacity-30"
            style={{ color: "var(--muted-foreground)" }}
            aria-hidden
          />
          <Text size="sm" style={{ color: "var(--muted-foreground)" }}>
            {t("admin.reportNoReports")}
          </Text>
        </Stack>
      )}

      {!loading && !error && visibleReports.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <ScrollArea>
            <Table
              verticalSpacing="md"
              horizontalSpacing="lg"
              highlightOnHover
              withRowBorders
              miw={920}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t("admin.reportTypeColumn")}</Table.Th>
                  <Table.Th>{t("admin.reportTargetColumn")}</Table.Th>
                  <Table.Th>{t("admin.reportMessageColumn")}</Table.Th>
                  <Table.Th>{t("admin.reportDateColumn")}</Table.Th>
                  <Table.Th>{t("admin.reportActionsColumn")}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {visibleReports.map((report) => {
                  const targetType = getReportTargetType(report);
                  const isUserReport = targetType === "user";
                  const isCommentReport = targetType === "comment";
                  const profile = report.reportedUserId
                    ? reportedProfiles.get(report.reportedUserId)
                    : null;
                  const isDeleting = deletingReportIds.has(report.id);
                  const isDeletingPost = report.postId
                    ? deletingPostIds.has(report.postId)
                    : false;
                  const isDeletingComment = report.commentId
                    ? deletingCommentIds.has(report.commentId)
                    : false;
                  const commentPostId = report.commentId
                    ? commentPostIds.get(report.commentId)
                    : null;
                  const targetHref = profile
                    ? `/profile/${encodeURIComponent(profile.username)}`
                    : report.postId
                      ? `/posts/${encodeURIComponent(report.postId)}`
                      : report.commentId && commentPostId
                        ? `/posts/${encodeURIComponent(commentPostId)}?comment=${encodeURIComponent(report.commentId)}`
                      : null;
                  const targetLabel = profile
                    ? `@${profile.username}`
                    : report.postId
                      ? t("admin.reportPostTarget", { postId: report.postId })
                      : report.commentId
                        ? t("admin.reportCommentTarget", {
                            commentId: report.commentId,
                          })
                      : report.reportedUserId ?? t("admin.reportUnknownTarget");

                  return (
                    <Table.Tr key={report.id}>
                      <Table.Td>
                        <Badge
                          variant="light"
                          color={isUserReport ? "red" : "yellow"}
                          radius={8}
                          leftSection={
                            isUserReport ? (
                              <FiUser size={12} />
                            ) : isCommentReport ? (
                              <FiMessageCircle size={12} />
                            ) : (
                              <FiFileText size={12} />
                            )
                          }
                        >
                          {isUserReport
                            ? t("admin.reportTypeUser")
                            : isCommentReport
                              ? t("admin.reportTypeComment")
                              : t("admin.reportTypePost")}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {targetHref ? (
                          <Link
                            href={targetHref}
                            className="inline-flex max-w-56 items-center gap-2 truncate text-sm font-semibold text-foreground outline-none hover:text-breezy-green focus-visible:rounded focus-visible:ring-2 focus-visible:ring-breezy-green"
                          >
                            <span className="truncate">{targetLabel}</span>
                            <FiExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                          </Link>
                        ) : (
                          <Text size="sm" style={{ color: "var(--muted-foreground)" }}>
                            {targetLabel}
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" lineClamp={3}>
                          {report.message}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" style={{ color: "var(--muted-foreground)" }}>
                          {dateFormatter.format(new Date(report.createdAt))}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" wrap="nowrap">
                          {targetHref && (
                            <Tooltip label={t("admin.reportOpenTarget")}>
                              <ActionIcon
                                component={Link}
                                href={targetHref}
                                variant="subtle"
                                color="green"
                                radius="xl"
                                aria-label={t("admin.reportOpenTarget")}
                              >
                                <FiExternalLink size={18} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                          {report.postId && (
                            <Tooltip label={t("admin.reportDeletePostAria")}>
                              <ActionIcon
                                type="button"
                                variant="subtle"
                                color="red"
                                radius="xl"
                                aria-label={t("admin.reportDeletePostAria")}
                                disabled={isDeletingPost}
                                onClick={() => setPostDeleteReport(report)}
                              >
                                {isDeletingPost ? (
                                  <Loader size="xs" />
                                ) : (
                                  <FiFileMinus size={18} />
                                )}
                              </ActionIcon>
                            </Tooltip>
                          )}
                          {report.commentId && (
                            <Tooltip label={t("admin.reportDeleteCommentAria")}>
                              <ActionIcon
                                type="button"
                                variant="subtle"
                                color="red"
                                radius="xl"
                                aria-label={t("admin.reportDeleteCommentAria")}
                                disabled={isDeletingComment}
                                onClick={() => setCommentDeleteReport(report)}
                              >
                                {isDeletingComment ? (
                                  <Loader size="xs" />
                                ) : (
                                  <FiMessageCircle size={18} />
                                )}
                              </ActionIcon>
                            </Tooltip>
                          )}
                          <Tooltip label={t("admin.reportDeleteAria")}>
                            <ActionIcon
                              type="button"
                              variant="subtle"
                              color="red"
                              radius="xl"
                              aria-label={t("admin.reportDeleteAria")}
                              disabled={
                                isDeleting || isDeletingPost || isDeletingComment
                              }
                              onClick={() => void handleDeleteReport(report)}
                            >
                              {isDeleting ? <Loader size="xs" /> : <FiTrash2 size={18} />}
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </div>
      )}
    </section>
  );
}
