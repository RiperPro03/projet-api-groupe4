"use client"

import { cn } from "@/lib/utils"

interface Avatar {
  imageUrl: string
  profileUrl: string
}

interface AvatarCirclesProps {
  className?: string
  numPeople?: number
  avatarUrls: Avatar[]
}

export function AvatarCircles({
  numPeople,
  className,
  avatarUrls,
}: AvatarCirclesProps) {
  return (
    <div className={cn("z-10 flex -space-x-3 rtl:space-x-reverse", className)}>
      {avatarUrls.map((url, index) => (
        <a
          key={`${url.profileUrl}-${index}`}
          href={url.profileUrl}
          className="inline-block"
          onClick={(event) => {
            if (url.profileUrl === "#") {
              event.preventDefault()
            }
          }}
        >
          <img
            className="size-8 rounded-full border-2 border-[var(--card)] object-cover"
            src={url.imageUrl}
            width={32}
            height={32}
            alt=""
          />
        </a>
      ))}
      {(numPeople ?? 0) > 0 && (
        <span className="flex size-8 items-center justify-center rounded-full border-2 border-[var(--card)] bg-[var(--muted)] text-center text-xs font-medium text-[var(--foreground)]">
          +{numPeople}
        </span>
      )}
    </div>
  )
}
