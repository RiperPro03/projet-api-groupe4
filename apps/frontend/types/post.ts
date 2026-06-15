export type Author = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
};

export type MediaType = "image" | "video";

export type Media = {
  id: string;
  type: MediaType;
  url: string;
  alt?: string;
};

export type Post = {
  id: string;
  author: Author;
  content: string;
  media: Media[];
  likesCount: number;
  commentsCount: number;
  createdAt: string;
};
