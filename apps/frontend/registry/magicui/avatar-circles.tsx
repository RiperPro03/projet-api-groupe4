"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type AvatarCircle = {
  imageUrl: string;
  profileUrl: string;
};

type AvatarCirclesProps = {
  className?: string;
  numPeople?: number;
  avatarUrls: AvatarCircle[];
};

function AvatarCircleLink({
  avatar,
  index,
}: {
  avatar: AvatarCircle;
  index: number;
}) {
  const image = (
    <img
      className="h-full w-full rounded-full object-cover"
      src={avatar.imageUrl}
      width={40}
      height={40}
      alt={`Avatar ${index + 1}`}
    />
  );
  const className =
    "relative inline-block h-10 w-10 rounded-full ring-2 ring-background";

  if (avatar.profileUrl.startsWith("/")) {
    return (
      <Link className={className} href={avatar.profileUrl}>
        {image}
      </Link>
    );
  }

  return (
    <a
      className={className}
      href={avatar.profileUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      {image}
    </a>
  );
}

export function AvatarCircles({
  numPeople,
  className,
  avatarUrls,
}: AvatarCirclesProps) {
  return (
    <div className={cn("z-10 flex -space-x-4 rtl:space-x-reverse", className)}>
      {avatarUrls.map((avatar, index) => (
        <AvatarCircleLink key={`${avatar.profileUrl}-${index}`} avatar={avatar} index={index} />
      ))}
      {(numPeople ?? 0) > 0 && (
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-center text-xs font-medium text-background ring-2 ring-background">
          +{numPeople}
        </span>
      )}
    </div>
  );
}
