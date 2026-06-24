"use client";

import { useI18n } from "@/lib/i18n/client";

export default function ChatStatusDot({ online }: { online: boolean }) {
  const { t } = useI18n();

  return (
    <span
      aria-label={online ? t("chat.online") : t("chat.offline")}
      className={`inline-block size-2.5 rounded-full ${
        online ? "bg-breezy-green" : "bg-muted-foreground"
      }`}
    />
  );
}
