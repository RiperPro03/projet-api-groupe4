import axios from "axios";

import { internalHttpClient } from "./internal-http.client.js";

function getInteractionErrorStatus(error: unknown): number | "unknown" {
  if (axios.isAxiosError(error) && error.response?.status) {
    return error.response.status;
  }

  return "unknown";
}

export async function deletePostInteractions(postId: string): Promise<void> {
  try {
    await internalHttpClient.delete(
      `/interactions/posts/${encodeURIComponent(postId)}/interactions`
    );
  } catch (error) {
    throw new Error(
      `interaction-service responded with status ${getInteractionErrorStatus(
        error
      )}`
    );
  }
}
