"use client";

import {
  ActionIcon,
  Alert,
  Box,
  Group,
  Image,
  Loader,
  Modal,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { useEffect, useRef, useState } from "react";
import { FiPlus, FiSend, FiTrash2, FiUpload } from "react-icons/fi";
import CommentComposer from "@/components/comments/CommentComposer";
import CommentThread from "@/components/comments/CommentThread";
import { AnimatedList } from "@/components/ui/animated-list";
import { usePostList, type FetchPostPage } from "@/hooks/usePostList";
import { createComment } from "@/lib/api/comment.service";
import { getCurrentUserFromApi } from "@/lib/api/current-user.service";
import { getApiErrorMessage, httpClient, isApiStatusCode } from "@/lib/api/http-client";
import { likePost, unlikePost } from "@/lib/api/interaction.service";
import { createPost, deletePost } from "@/lib/api/post.service";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  hydrateLike,
  markLiked,
  markUnliked,
  selectLikeState,
} from "@/store/likesSlice";
import type { Comment } from "@/types/comment";
import type { Media, Post } from "@/types/post";
import ContentCard from "@/components/feed/ContentCard";
import { RippleButton } from "@/components/ui/ripple-button";
import { ShineBorder } from "@/components/ui/shine-border";

type PostListProps = {
  fetchPosts: FetchPostPage;
  fetchUpdatedPosts?: FetchPostPage;
  fetchCommentsForPost?: (postId: string) => Promise<Comment[]>;
  pageSize?: number;
  title?: string;
  showCreateButton?: boolean;
};

const postMediaMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
];
const postImageMaxSize = 100 * 1024 * 1024;
const postVideoMaxSize = 10000 * 1024 * 1024;
const postMediaMaxFiles = 4;
const secondaryButtonClassName =
  "rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60";
const greenButtonClassName =
  "rounded-full border-0 bg-breezy-green px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-breezy-green/20 transition-colors hover:bg-breezy-green/90 disabled:cursor-not-allowed disabled:opacity-60";
const redButtonClassName =
  "rounded-full border-0 bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60";
const addPostButtonClassName =
  "relative z-10 rounded-full border border-transparent bg-transparent px-5 py-2.5 text-sm font-bold text-foreground shadow-lg shadow-black/20 transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60";

type PresignedUrlResponse = {
  status: "success";
  data: {
    uploadUrl: string;
    objectKey: string;
    publicUrl: string;
    expiresIn: number;
  };
};

function getPostMediaType(file: File): Media["type"] {
  return file.type.startsWith("video/") ? "video" : "image";
}

function isPostMediaSizeValid(file: File) {
  return file.size <= (getPostMediaType(file) === "video" ? postVideoMaxSize : postImageMaxSize);
}

async function uploadPostMedia(file: File): Promise<Media> {
  const presignedResponse = await httpClient.post<PresignedUrlResponse>(
    "/media/presigned-url",
    {
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      alt: file.name,
      usage: "post",
    }
  );

  await fetch(presignedResponse.data.data.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`Impossible d'envoyer le fichier vers le bucket. (${response.status})`);
    }
  });

  return {
    id: presignedResponse.data.data.objectKey,
    type: getPostMediaType(file),
    url: presignedResponse.data.data.publicUrl,
    alt: file.name,
  };
}

async function deleteUploadedPostMedia(media: Media) {
  await httpClient.delete(`/media/${encodeURIComponent(media.id)}`).catch(() => undefined);
}

function getCreatePostErrorMessage(error: unknown) {
  const apiErrorMessage = getApiErrorMessage(error);

  if (apiErrorMessage !== "Une erreur inattendue est survenue.") {
    return apiErrorMessage;
  }

  return error instanceof Error ? error.message : apiErrorMessage;
}

function PostFeedItem({
  post,
  fetchCommentsForPost,
  currentUserId,
  onDeletePost,
}: {
  post: Post;
  fetchCommentsForPost?: (postId: string) => Promise<Comment[]>;
  currentUserId: string | null;
  onDeletePost: (post: Post) => Promise<void>;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLikePending, setIsLikePending] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const canOpenComments = Boolean(fetchCommentsForPost);
  const canDeletePost = currentUserId !== null && post.author.id === currentUserId;
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

  function handleToggleComments() {
    const nextShowComments = !showComments;

    if (nextShowComments && comments.length === 0) {
      setIsLoadingComments(true);
    }

    setShowComments(nextShowComments);
  }

  async function confirmDeletePost() {
    if (isDeletingPost) {
      return;
    }

    setIsDeletingPost(true);
    try {
      await onDeletePost(post);
    } finally {
      setIsDeletingPost(false);
      setIsDeleteConfirmOpen(false);
    }
  }

  return (
    <Stack gap="sm">
      <Modal
        opened={isDeleteConfirmOpen}
        onClose={() => {
          if (!isDeletingPost) {
            setIsDeleteConfirmOpen(false);
          }
        }}
        title="Supprimer le post"
        centered
        radius={8}
        closeOnClickOutside={!isDeletingPost}
        closeOnEscape={!isDeletingPost}
        overlayProps={{ backgroundOpacity: 0.72, blur: 2 }}
      >
        <Stack gap="md">
          <Text size="sm" style={{ color: "var(--muted-foreground)" }}>
            Ce post sera retiré du fil. Cette action est définitive.
          </Text>

          <Group justify="flex-end">
            <RippleButton
              type="button"
              rippleColor="#ffffff"
              disabled={isDeletingPost}
              onClick={() => setIsDeleteConfirmOpen(false)}
              className={secondaryButtonClassName}
            >
              Annuler
            </RippleButton>
            <RippleButton
              type="button"
              rippleColor="#ffffff"
              disabled={isDeletingPost}
              onClick={confirmDeletePost}
              className={redButtonClassName}
            >
              <span className="flex items-center gap-2">
                <FiTrash2 size={16} />
                {isDeletingPost ? "Suppression..." : "Supprimer"}
              </span>
            </RippleButton>
          </Group>
        </Stack>
      </Modal>

      <ContentCard
        type="post"
        author={post.author}
        content={post.content}
        media={post.media}
        createdAt={post.createdAt}
        likesCount={likesCount}
        commentsCount={commentsCount}
        isLiked={isLiked}
        onComment={
          canOpenComments ? handleToggleComments : undefined
        }
        isDeleting={isDeletingPost}
        onDelete={
          canDeletePost
            ? () => {
                if (isDeletingPost) {
                  return;
                }

                setIsDeleteConfirmOpen(true);
              }
            : undefined
        }
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
  title = "Fil d'actualité",
}: PostListProps) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const mediaPreviewsRef = useRef<string[]>([]);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [selectedPostMedia, setSelectedPostMedia] = useState<File[]>([]);
  const [postMediaPreviews, setPostMediaPreviews] = useState<string[]>([]);
  const [createPostError, setCreatePostError] = useState<string | null>(null);
  const [postActionError, setPostActionError] = useState<string | null>(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const {
    posts,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    prependPost,
    removePost,
    loadMore,
  } = usePostList({
    fetchPosts,
    fetchUpdatedPosts,
    pageSize,
  });

  function setPreviewUrls(updater: (current: string[]) => string[]) {
    setPostMediaPreviews((current) => {
      const next = updater(current);
      mediaPreviewsRef.current = next;
      return next;
    });
  }

  function addSelectedPostMedia(files: File[]) {
    const remainingSlots = postMediaMaxFiles - selectedPostMedia.length;
    const validFiles = files.filter(isPostMediaSizeValid);
    const nextFiles = validFiles.slice(0, remainingSlots);

    if (nextFiles.length === 0) {
      if (files.length > 0) {
        setCreatePostError("Images 100 Mo maximum. Vidéos 10 Go maximum.");
      }

      return;
    }

    setCreatePostError(
      validFiles.length === files.length
        ? null
        : "Certains fichiers trop lourds ont été ignorés. Images 100 Mo, vidéos 10 Go."
    );
    setSelectedPostMedia((current) => [...current, ...nextFiles]);
    setPreviewUrls((current) => [
      ...current,
      ...nextFiles.map((file) => URL.createObjectURL(file)),
    ]);
  }

  function removeSelectedPostMedia(index: number) {
    setSelectedPostMedia((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setPreviewUrls((current) => {
      const previewUrl = current[index];

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  function resetCreatePostForm() {
    mediaPreviewsRef.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    mediaPreviewsRef.current = [];
    setPostContent("");
    setSelectedPostMedia([]);
    setPostMediaPreviews([]);
    setCreatePostError(null);
  }

  function closeCreatePostModal() {
    if (isCreatingPost) {
      return;
    }

    resetCreatePostForm();
    setIsCreatePostOpen(false);
  }

  async function handleCreatePost() {
    const trimmedContent = postContent.trim();

    if (!trimmedContent || isCreatingPost) {
      return;
    }

    setIsCreatingPost(true);
    setCreatePostError(null);
    const uploadedMedia: Media[] = [];

    try {
      for (const media of selectedPostMedia) {
        uploadedMedia.push(await uploadPostMedia(media));
      }

      const post = await createPost({
        content: trimmedContent,
        media: uploadedMedia,
      });
      prependPost(post);
      resetCreatePostForm();
      setIsCreatePostOpen(false);
    } catch (error) {
      await Promise.all(uploadedMedia.map(deleteUploadedPostMedia));
      setCreatePostError(getCreatePostErrorMessage(error));
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
      setPostActionError(`Suppression impossible. ${getApiErrorMessage(deleteError)}`);
    }
  }

  useEffect(() => {
    let isMounted = true;

    getCurrentUserFromApi()
      .then((currentUser) => {
        if (isMounted) {
          setCurrentUserId(
            currentUser.profile?.id_user ?? currentUser.user?.id_user ?? currentUser.auth.id
          );
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
        title="Ajouter un post"
        centered
        radius={8}
        overlayProps={{ backgroundOpacity: 0.72, blur: 2 }}
      >
        <Stack gap="md">
          <Textarea
            value={postContent}
            onChange={(event) => setPostContent(event.currentTarget.value)}
            placeholder="Quoi de neuf ?"
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
              setCreatePostError("Choisissez jusqu'à 4 fichiers JPG, PNG, GIF, WebP, MP4 ou WebM. Images 100 Mo, vidéos 10 Go.");
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
                  Ajouter des fichiers
                </Text>
                <Text size="sm" style={{ color: "var(--muted-foreground)" }}>
                  JPG, PNG, GIF, WebP, MP4 ou WebM. Images 100 Mo, vidéos 10 Go.
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
                        aria-label={file?.name ?? "Vidéo du post"}
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
                        alt={file?.name ?? "Image du post"}
                        h="100%"
                        w="100%"
                        fit="cover"
                      />
                    )}
                    <ActionIcon
                      aria-label="Retirer le fichier"
                      color="red"
                      radius="xl"
                      size="sm"
                      variant="filled"
                      onClick={() => removeSelectedPostMedia(index)}
                      style={{
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
              Limite de 4 fichiers atteinte.
            </Text>
          )}

          {createPostError && (
            <Alert color="red" variant="light">
              {createPostError}
            </Alert>
          )}

          <Group justify="flex-end">
            <RippleButton
              type="button"
              rippleColor="#ffffff"
              disabled={isCreatingPost}
              onClick={closeCreatePostModal}
              className={secondaryButtonClassName}
            >
              Annuler
            </RippleButton>
            <RippleButton
              type="button"
              rippleColor="#000000"
              disabled={!postContent.trim() || isCreatingPost}
              onClick={handleCreatePost}
              className={greenButtonClassName}
            >
              <span className="flex items-center gap-2">
                <FiSend size={16} />
                {isCreatingPost ? "Publication..." : "Publier"}
              </span>
            </RippleButton>
          </Group>
        </Stack>
      </Modal>

      <Group justify="space-between" align="center">
        <Text fw={700} style={{ color: "var(--foreground)" }} size="lg">
          {title}
        </Text>
        <div className="relative rounded-full">
          <ShineBorder
            borderWidth="0.125rem"
            duration={15}
            shineColor={["#00923e", "#f8c100", "#00923e"]}
            className="z-20"
          />
          <RippleButton
            type="button"
            rippleColor="#00923e"
            onClick={() => setIsCreatePostOpen(true)}
            className={addPostButtonClassName}
          >
            <span className="flex items-center gap-2">
              <FiPlus size={16} />
              Ajouter un post
            </span>
          </RippleButton>
        </div>
      </Group>

      {error && (
        <Alert color="red" variant="light">
          {error}
        </Alert>
      )}

      {postActionError && (
        <Alert color="red" variant="light">
          {postActionError}
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
              currentUserId={currentUserId}
              fetchCommentsForPost={fetchCommentsForPost}
              onDeletePost={handleDeletePost}
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
