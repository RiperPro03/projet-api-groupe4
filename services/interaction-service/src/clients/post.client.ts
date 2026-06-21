import { internalHttpClient } from "./internal-http.client.js";

type PostResponseBody = {
  status?: string;
  data?: {
    post?: {
      authorId?: string;
    };
  };
};

export async function getPostAuthorId(postId: string): Promise<string | null> {
  try {
    const { data } = await internalHttpClient.get<PostResponseBody>(
      `/posts/${postId}`
    );
    const authorId = data.data?.post?.authorId?.trim();

    return authorId || null;
  } catch {
    return null;
  }
}
