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
  size?: "default" | "sm";
};

const sizeClasses = {
  default: {
    avatar: "h-10 w-10",
    badge: "h-10 w-10 text-xs",
  },
  sm: {
    avatar: "h-7 w-7",
    badge: "h-7 w-7 text-[10px]",
  },
} as const;

function AvatarCircleLink({
  avatar,
  index,
  size = "default",
}: {
  avatar: AvatarCircle;
  index: number;
  size?: "default" | "sm";
}) {
  const dimensions = size === "sm" ? 28 : 40;
  const image = (
    <img
      className="h-full w-full rounded-full object-cover"
      src={avatar.imageUrl}
      width={dimensions}
      height={dimensions}
      alt={`Avatar ${index + 1}`}
    />
  );
  const className = cn(
    "relative inline-block rounded-full ring-2 ring-background",
    sizeClasses[size].avatar
  );

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
  size = "default",
}: AvatarCirclesProps) {
  const overlapClass = size === "sm" ? "-space-x-2.5" : "-space-x-4";

  return (
    <div className={cn("z-10 flex rtl:space-x-reverse", overlapClass, className)}>
      {avatarUrls.map((avatar, index) => (
        <AvatarCircleLink
          key={`${avatar.profileUrl}-${index}`}
          avatar={avatar}
          index={index}
          size={size}
        />
      ))}
      {(numPeople ?? 0) > 0 && (
        <span
          className={cn(
            "flex items-center justify-center rounded-full bg-foreground text-center font-medium text-background ring-2 ring-background",
            sizeClasses[size].badge
          )}
        >
          +{numPeople}
        </span>
      )}
    </div>
  );
}
