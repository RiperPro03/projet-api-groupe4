"use client";

import { AvatarCircles } from "@/registry/magicui/avatar-circles";
import { mapAuthorsToAvatarCircles } from "@/lib/posts/liker-avatars";
import type { Author } from "@/types/post";

type PostLikersAvatarsProps = {
  likers: Author[];
  likesCount: number;
  className?: string;
  size?: "default" | "sm";
};

export default function PostLikersAvatars({
  likers,
  likesCount,
  className,
  size = "default",
}: PostLikersAvatarsProps) {
  if (likers.length === 0 || likesCount === 0) {
    return null;
  }

  const avatarUrls = mapAuthorsToAvatarCircles(likers);
  const extraLikers = Math.max(0, likesCount - avatarUrls.length);

  return (
    <AvatarCircles
      className={className}
      avatarUrls={avatarUrls}
      numPeople={extraLikers}
      size={size}
    />
  );
}
