"use client";

import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import { AnimatedList } from "@/components/ui/animated-list";
import { cn } from "@/lib/utils";

export type NotificationTone = "error" | "loading" | "success";

export type AppNotification = {
  id: string;
  title: string;
  description: string;
  tone: NotificationTone;
};

type NotificationListProps = {
  notifications: AppNotification[];
  className?: string;
};

const toneStyles = {
  error: {
    icon: AlertCircle,
    iconClassName: "bg-red-500/15 text-red-300",
    borderClassName: "border-red-500/25",
  },
  loading: {
    icon: LoaderCircle,
    iconClassName: "bg-breezy-green/15 text-breezy-green",
    borderClassName: "border-breezy-green/25",
  },
  success: {
    icon: CheckCircle2,
    iconClassName: "bg-breezy-green/15 text-breezy-green",
    borderClassName: "border-breezy-green/25",
  },
} satisfies Record<
  NotificationTone,
  {
    icon: typeof AlertCircle;
    iconClassName: string;
    borderClassName: string;
  }
>;

function NotificationItem({ title, description, tone }: AppNotification) {
  const styles = toneStyles[tone];
  const Icon = styles.icon;

  return (
    <figure
      className={cn(
        "w-full overflow-hidden rounded-xl border bg-breezy-black/95 p-4 text-white shadow-2xl shadow-black/30 backdrop-blur-md",
        "transition-all duration-200 ease-in-out",
        styles.borderClassName,
      )}
      role={tone === "error" ? "alert" : "status"}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            styles.iconClassName,
          )}
        >
          <Icon
            className={cn("size-5", tone === "loading" && "animate-spin")}
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0">
          <figcaption className="truncate text-sm font-semibold">
            {title}
          </figcaption>
          <p className="mt-0.5 text-sm text-white/65">{description}</p>
        </div>
      </div>
    </figure>
  );
}

export function NotificationList({
  notifications,
  className,
}: NotificationListProps) {
  const visibleNotifications = notifications.slice(-2);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-4 top-4 z-50 mx-auto w-auto max-w-sm",
        className,
      )}
    >
      <AnimatedList delay={120} className="gap-3">
        {visibleNotifications.map((notification) => (
          <NotificationItem key={notification.id} {...notification} />
        ))}
      </AnimatedList>
    </div>
  );
}
