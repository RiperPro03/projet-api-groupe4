import { env } from "../config/env.js";

type PostResponseBody = {
  status?: string;
  data?: {
    post?: {
      authorId?: string;
    };
  };
};

export async function getPostAuthorId(postId: string): Promise<string | null> {
  const response = await fetch(`${env.postServiceUrl}/posts/${postId}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  const body = (await response.json()) as PostResponseBody;
  const authorId = body.data?.post?.authorId?.trim();

  return authorId || null;
}
