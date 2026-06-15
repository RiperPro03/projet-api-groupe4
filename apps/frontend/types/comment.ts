import type { Author, Media } from "./post";

export type Comment = {
  id: string;
  id_post: string;
  parentCommentId?: string | null;
  author: Author;
  content: string;
  media: Media[];
  likesCount: number;
  repliesCount: number;
  createdAt: string;
};
