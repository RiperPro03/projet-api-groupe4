"use client";

import {
  Alert,
  Button,
  Group,
  Loader,
  Modal,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiPlus, FiSearch, FiSend, FiX, FiX } from "react-icons/fi";
import CommentComposer from "@/components/comments/CommentComposer";
import CommentThread from "@/components/comments/CommentThread";
import { AnimatedList } from "@/components/ui/animated-list";
import { MagicCard } from "@/components/ui/magic-card";
import { useNotifications } from "@/components/notifications/NotificationProvider";
import { ReportDialog } from "@/components/reports/ReportDialog";
import { usePostList, type FetchPostPage } from "@/hooks/usePostList";
import { createComment } from "@/lib/api/comment.service";
import { getCurrentUserFromApi } from "@/lib/api/current-user.service";
import { isApiStatusCode } from "@/lib/api/http-client";
import { likePost, unlikePost } from "@/lib/api/interaction.service";
import { createPost, fetchPostsByTag, deletePost } from "@/lib/api/post.service";
import { createContentReport } from "@/lib/api/report.service";
import { getAuthenticatedUserId } from "@/lib/current-user-ids";
import { useI18n } from "@/lib/i18n/client";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  hydrateLike,
  markLiked,
  markUnliked,
  selectLikeState,
} from "@/store/likesSlice";
import type { Comment } from "@/types/comment";
import type { Post } from "@/types/post";
import ContentCard from "@/components/feed/ContentCard";

type PostListProps = {
  fetchPosts: FetchPostPage;
  fetchUpdatedPosts?: FetchPostPage;
  fetchCommentsForPost?: (postId: string) => Promise<Comment[]>;
  pageSize?: number;
  title?: string;
  showCreateButton?: boolean;
  showTagSearch?: boolean;
};

function PostFeedItem({
  post,
  fetchCommentsForPost,
  currentUserId,
  onDeletePost,
  onReportPost,
}: {
  post: Post;
  fetchCommentsForPost?: (postId: string) => Promise<Comment[]>;
  currentUserId: string | null;
  onDeletePost: (post: Post) => Promise<void>;
  onReportPost: (post: Post) => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLikePending, setIsLikePending] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const canOpenComments = Boolean(fetchCommentsForPost);
  const dispatch = useAppDispatch();
  const likeState = useAppSelector((state) =>
    selectLikeState(state, "post", post.id)
  );
  const likesCount = likeState?.likesCount ?? post.likesCount;
  const isLiked = likeState?.isLiked ?? post.isLiked ?? false;

  useEffect(() => {
    dispatch(
      hydrateLike({
        targetType: "post",
        targetId: post.id,
        likesCount: post.likesCount,
        isLiked: post.isLiked,
      })
    );
  }, [dispatch, post.id, post.isLiked, post.likesCount]);

  useEffect(() => {
    if (!showComments || !fetchCommentsForPost || comments.length > 0) {
      return;
    }

    let isMounted = true;
    setIsLoadingComments(true);

    fetchCommentsForPost(post.id)
      .then((items) => {
        if (isMounted) {
          setComments(items);
          setCommentsCount(items.filter((item) => !item.parentCommentId).length);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingComments(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [comments.length, fetchCommentsForPost, post.id, showComments]);

  async function handleCommentSubmit(content: string) {
    const newComment = await createComment({
      postId: post.id,
      content,
    });

    setComments((currentComments) => [newComment, ...currentComments]);
    setCommentsCount((count) => count + 1);
    setShowComments(true);
  }

  async function handleReplySubmit(parentComment: Comment, content: string) {
    const newReply = await createComment({
      postId: post.id,
      content,
      parentCommentId: parentComment.id,
    });

    setComments((currentComments) =>
      currentComments
        .map((comment) =>
          comment.id === parentComment.id
            ? { ...comment, repliesCount: comment.repliesCount + 1 }
            : comment
        )
        .concat(newReply)
    );
  }

  return (
    <Stack gap="sm">
      <ContentCard
        type="post"
        author={post.author}
        content={post.content}
        media={post.media}
        createdAt={post.createdAt}
        likesCount={likesCount}
        likers={post.likers}
        commentsCount={commentsCount}
        isLiked={isLiked}
        onComment={
          canOpenComments ? () => setShowComments((value) => !value) : undefined
        }
        onReport={() => onReportPost(post)}
        onLike={async () => {
          if (isLikePending) {
            return;
          }

          const currentUser = await getCurrentUserFromApi();
          const userId =
            currentUser.profile?.id_user ??
            currentUser.user?.id_user ??
            currentUser.auth.id;

          setIsLikePending(true);

          if (isLiked) {
            dispatch(markUnliked({ targetType: "post", targetId: post.id }));
            try {
              await unlikePost(userId, post.id);
            } catch (error) {
              if (!isApiStatusCode(error, 404)) {
                dispatch(markLiked({ targetType: "post", targetId: post.id }));
              }
            } finally {
              setIsLikePending(false);
            }
            return;
          }

          dispatch(markLiked({ targetType: "post", targetId: post.id }));
          try {
            await likePost(userId, post.id);
          } catch (error) {
            if (!isApiStatusCode(error, 409)) {
              dispatch(markUnliked({ targetType: "post", targetId: post.id }));
            }
          } finally {
            setIsLikePending(false);
          }
        }}
      />

      {canOpenComments && showComments && (
        <Stack gap="sm" pl={{ base: 0, sm: 56 }}>
          <CommentComposer onSubmit={handleCommentSubmit} />
          {isLoadingComments ? (
            <Group justify="center" py="sm">
              <Loader color="green" size="sm" />
            </Group>
          ) : (
            <CommentThread
              comments={comments}
              maxVisualDepth={2}
              onReplySubmit={handleReplySubmit}
            />
          )}
        </Stack>
      )}
    </Stack>
  );
}

export default function PostList({
  fetchPosts,
  fetchUpdatedPosts,
  fetchCommentsForPost,
  pageSize = 5,
  title = "Fil d'actualite",
  showCreateButton = true,
  showTagSearch = false,
}: PostListProps) {
  const { t } = useI18n();
  const { notify } = useNotifications();
  const listTitle = title ?? t("post.feedTitle");
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [selectedPostMedia, setSelectedPostMedia] = useState<File[]>([]);
  const [postMediaPreviews, setPostMediaPreviews] = useState<string[]>([]);
  const [createPostError, setCreatePostError] = useState<string | null>(null);
  const [postActionError, setPostActionError] = useState<string | null>(null);
  const [reportPost, setReportPost] = useState<Post | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isReportingPost, setIsReportingPost] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const effectiveFetchPosts: FetchPostPage = useMemo(() => {
    if (activeTag) return fetchPostsByTag(activeTag);
    return fetchPosts;
  }, [activeTag, fetchPosts]);

  const {
    posts,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    prependPost,
    loadMore,
  } = usePostList({
    fetchPosts: effectiveFetchPosts,
    fetchUpdatedPosts: activeTag ? undefined : fetchUpdatedPosts,
    pageSize,
  });

  async function handleCreatePost() {
    const trimmedContent = postContent.trim();

    if (!trimmedContent || isCreatingPost) {
      return;
    }

    setIsCreatingPost(true);

    try {
      const post = await createPost({ content: trimmedContent });
      prependPost(post);
      setPostContent("");
      setIsCreatePostOpen(false);
    } finally {
      setIsCreatingPost(false);
    }
  }

  async function handleDeletePost(post: Post) {
    setPostActionError(null);
    removePost(post.id);

    try {
      await deletePost(post.id);
    } catch (deleteError) {
      prependPost(post);
      setPostActionError(
        t("post.deleteImpossible", {
          message: getApiErrorMessage(
            deleteError,
            t("common.unknownError"),
            t("common.serverUnreachable")
          ),
        })
      );
    }
  }

  async function handleReportPost(message: string) {
    if (!reportPost || isReportingPost) {
      return;
    }

    setIsReportingPost(true);
    setReportError(null);

    try {
      await createContentReport({
        message,
        postId: reportPost.id,
      });
      setReportPost(null);
      notify({
        title: t("report.successTitle"),
        description: t("report.postSuccessDescription"),
        tone: "success",
      });
    } catch (error) {
      setReportError(
        getApiErrorMessage(
          error,
          t("report.errorDescription"),
          t("common.serverUnreachable")
        )
      );
    } finally {
      setIsReportingPost(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    getCurrentUserFromApi()
      .then((currentUser) => {
        if (isMounted) {
          setCurrentUserId(getAuthenticatedUserId(currentUser));
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      mediaPreviewsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    };
  }, []);

  useEffect(() => {
    const element = loadMoreRef.current;

    if (!element || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "360px 0px" }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadMore]);

  if (isLoading) {
    return (
      <Group justify="center" py="xl">
        <Loader color="green" />
      </Group>
    );
  }

  return (
    <Stack gap="md">
      <Modal
        opened={isCreatePostOpen}
        onClose={closeCreatePostModal}
        title={t("post.modalTitle")}
        centered
        radius={8}
        padding={0}
        withCloseButton={false}
        overlayProps={{ backgroundOpacity: 0.72, blur: 2 }}
      >
        <Stack gap="md">
          <Textarea
            value={postContent}
            onChange={(event) => setPostContent(event.currentTarget.value)}
            placeholder={t("post.composerPlaceholder")}
            autosize
            minRows={4}
            maxRows={10}
          />
          <Dropzone
            accept={postMediaMimeTypes}
            maxFiles={postMediaMaxFiles}
            maxSize={postVideoMaxSize}
            multiple
            disabled={isCreatingPost || selectedPostMedia.length >= postMediaMaxFiles}
            onDrop={addSelectedPostMedia}
            onReject={() => {
              setCreatePostError(t("post.fileReject"));
            }}
            style={{
              border: "1px dashed var(--border)",
              borderRadius: 8,
              background: "var(--muted)",
              padding: 0,
            }}
          >
            <Group gap="sm" p="md" wrap="nowrap">
              <Box
                style={{
                  alignItems: "center",
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  display: "flex",
                  height: 44,
                  justifyContent: "center",
                  width: 44,
                }}
              >
                <FiUpload size={20} />
              </Box>
              <Box style={{ minWidth: 0 }}>
                <Text fw={600} size="sm" style={{ color: "var(--foreground)" }}>
                  {t("post.addFiles")}
                </Text>
                <Text size="sm" style={{ color: "var(--muted-foreground)" }}>
                  {t("post.fileHint")}
                </Text>
              </Box>
            </Group>
          </Dropzone>

          {postMediaPreviews.length > 0 && (
            <Box
              style={{
                display: "grid",
                gap: 8,
                gridTemplateColumns:
                  postMediaPreviews.length === 1
                    ? "1fr"
                    : "repeat(2, minmax(0, 1fr))",
              }}
            >
              {postMediaPreviews.map((previewUrl, index) => {
                const file = selectedPostMedia[index];
                const isVideo = file?.type.startsWith("video/");

                return (
                  <Box
                    key={previewUrl}
                    pos="relative"
                    style={{
                      aspectRatio: postMediaPreviews.length === 1 ? "16 / 10" : "1 / 1",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      overflow: "hidden",
                    }}
                  >
                    {isVideo ? (
                      <video
                        controls
                        muted
                        preload="metadata"
                        aria-label={file?.name ?? t("post.videoAlt")}
                        src={previewUrl}
                        style={{
                          display: "block",
                          height: "100%",
                          objectFit: "cover",
                          width: "100%",
                        }}
                      />
                    ) : (
                      <Image
                        src={previewUrl}
                        alt={file?.name ?? t("post.imageAlt")}
                        h="100%"
                        w="100%"
                        fit="cover"
                      />
                    )}
                    <ActionIcon
                      aria-label={t("post.removeFile")}
                      radius="xl"
                      size="sm"
                      variant="filled"
                      onClick={() => removeSelectedPostMedia(index)}
                      style={{
                        backgroundColor: "var(--destructive)",
                        color: "white",
                        position: "absolute",
                        right: 8,
                        top: 8,
                      }}
                    >
                      <FiTrash2 size={14} />
                    </ActionIcon>
                  </Box>
                );
              })}
            </Box>
          )}

          {selectedPostMedia.length >= postMediaMaxFiles && (
            <Text size="xs" style={{ color: "var(--muted-foreground)" }}>
              {t("post.maxFiles")}
            </Text>
          )}

          {createPostError && (
            <Alert
              variant="light"
              style={{
                backgroundColor: "color-mix(in oklch, var(--destructive) 12%, transparent)",
                borderColor: "color-mix(in oklch, var(--destructive) 35%, transparent)",
                color: "var(--destructive)",
              }}
            >
              {createPostError}
            </Alert>
          )}

      <ReportDialog
        opened={reportPost !== null}
        title={t("report.postTitle")}
        description={t("report.postDescription")}
        placeholder={t("report.postPlaceholder")}
        error={reportError}
        isSubmitting={isReportingPost}
        onClose={() => {
          if (!isReportingPost) {
            setReportPost(null);
            setReportError(null);
          }
        }}
        onSubmit={handleReportPost}
      />

      <Group justify="space-between" align="center">
        <Text fw={700} style={{ color: "var(--foreground)" }} size="lg">
          {listTitle}
        </Text>
        {showCreateButton && (
          <div className="relative rounded-full">
            <ShineBorder
              borderWidth="0.125rem"
              duration={15}
              shineColor={[
                "var(--color-breezy-green)",
                "var(--color-breezy-yellow)",
                "var(--color-breezy-green)",
              ]}
              className="z-20"
            />
            <RippleButton
              type="button"
              rippleColor="var(--color-breezy-black)"
              disabled={!postContent.trim() || isCreatingPost}
              onClick={handleCreatePost}
              className={greenButtonClassName}
            >
              <span className="flex items-center gap-2">
                <FiSend size={16} />
                {isCreatingPost ? t("common.publishing") : t("common.publish")}
              </span>
            </RippleButton>
          </Group>
        </Stack>
      </Modal>

      <Group justify="space-between" align="center">
        <Text fw={700} style={{ color: "var(--foreground)" }} size="lg">
          {title}
          {activeTag && (
            <Text component="span" size="sm" fw={400} ml="xs" style={{ color: "var(--muted-foreground)" }}>
              — #{activeTag}
            </Text>
          )}
        </Text>
        {showCreateButton && (
          <Button
            leftSection={<FiPlus size={16} />}
            variant="light"
            color="green"
            radius="xl"
            onClick={() => setIsCreatePostOpen(true)}
          >
            Ajouter un post
          </Button>
        )}
      </Group>

      {showTagSearch && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const t = tagInput.trim().replace(/^#/, "");
            setActiveTag(t || null);
          }}
        >
          <Group gap="xs">
            <div className="group relative flex-1 rounded-xl border border-input bg-background transition-shadow focus-within:border-transparent focus-within:shadow-[0_0_1.25rem_rgba(0,146,62,0.28)]">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                <FiSearch size={15} aria-hidden />
              </span>
              <input
                type="search"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  if (!e.target.value.trim()) setActiveTag(null);
                }}
                placeholder="Filtrer par tag…"
                aria-label="Rechercher par tag"
                className="w-full rounded-xl bg-transparent py-2 pl-9 pr-9 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              {tagInput && (
                <button
                  type="button"
                  onClick={() => { setTagInput(""); setActiveTag(null); }}
                  aria-label="Effacer le filtre"
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
            <Button type="submit" variant="light" color="green" radius="xl" size="sm">
              Filtrer
            </Button>
          </Group>
        </form>
      )}

      {error && (
        <Alert color="red" variant="light">
          {error}
        </Alert>
      )}

      {posts.length === 0 ? (
        <Text style={{ color: "var(--muted-foreground)" }} ta="center" py="xl">
          Aucun post pour le moment.
        </Text>
      ) : (
        <AnimatedList delay={0} reverseOrder={false} className="gap-3">
          {posts.map((post) => (
            <PostFeedItem
              key={post.id}
              post={post}
              fetchCommentsForPost={fetchCommentsForPost}
              onDeletePost={handleDeletePost}
              onReportPost={(post) => {
                setReportPost(post);
                setReportError(null);
              }}
            />
          ))}
        </AnimatedList>
      )}

      <div ref={loadMoreRef} aria-hidden="true" />

      {isLoadingMore && (
        <Group justify="center" py="md">
          <Loader color="green" size="sm" />
        </Group>
      )}

      {!hasMore && posts.length > 0 && (
        <Text style={{ color: "var(--muted-foreground)" }} ta="center" size="sm" py="sm">
          Vous avez atteint la fin du feed.
        </Text>
      )}
    </Stack>
  );
}
