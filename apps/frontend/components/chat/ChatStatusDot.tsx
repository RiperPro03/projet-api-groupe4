"use client";

export default function ChatStatusDot({ online }: { online: boolean }) {
  return (
    <span
      aria-label={online ? "Connecte" : "Deconnecte"}
      className={`inline-block size-2.5 rounded-full ${
        online ? "bg-breezy-green" : "bg-muted-foreground"
      }`}
    />
  );
}
