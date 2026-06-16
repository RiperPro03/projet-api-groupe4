import type { Author, Media } from "./post";

export type Comment = {
  id: string;
  id_post: string;
  parentCommentId?: string | null;
  author: Author;
  content: string;
  media: Media[];
  likesCount: number;
  isLiked?: boolean;
  repliesCount: number;
  createdAt: string;
};
