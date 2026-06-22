import type { Author } from "@/types/post";

function getAvatarImageUrl(author: Author) {
  if (author.avatarUrl) {
    return author.avatarUrl;
  }

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name)}&background=86efac&color=14532d`;
}

export function mapAuthorsToAvatarCircles(authors: Author[]) {
  return authors.map((author) => ({
    imageUrl: getAvatarImageUrl(author),
    profileUrl: `/profile/${encodeURIComponent(author.username)}`,
  }));
}
