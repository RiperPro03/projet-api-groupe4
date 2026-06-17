import { httpClient } from "./http-client";

type CountResponse = {
  count: number;
};

export async function getPostLikesCount(postId: string) {
  const { data } = await httpClient.get<CountResponse>("/posts/likes/count", {
    params: { postId },
  });

  return data.count;
}

export async function likePost(userId: string, postId: string) {
  const { data } = await httpClient.post("/posts/likes", { userId, postId });

  return data;
}

export async function unlikePost(userId: string, postId: string) {
  const { data } = await httpClient.delete("/posts/likes", {
    data: { userId, postId },
  });

  return data;
}

export async function getCommentLikesCount(commentId: string) {
  const { data } = await httpClient.get<CountResponse>("/comments/likes/count", {
    params: { commentId },
  });

  return data.count;
}

export async function likeComment(
  userId: string,
  commentId: string,
  postId: string
) {
  const { data } = await httpClient.post("/comments/likes", {
    userId,
    commentId,
    postId,
  });

  return data;
}

export async function unlikeComment(userId: string, commentId: string) {
  const { data } = await httpClient.delete("/comments/likes", {
    data: { userId, commentId },
  });

  return data;
}
