"use client";

import { useState } from "react";
import { Avatar, Group, Paper, Textarea } from "@mantine/core";
import { FiSend } from "react-icons/fi";
import { RippleButton } from "@/components/ui/ripple-button";

type CommentComposerProps = {
  placeholder?: string;
  onSubmit?: (content: string) => void | Promise<void>;
};

export default function CommentComposer({
  placeholder = "Écrire un commentaire...",
  onSubmit,
}: CommentComposerProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    const trimmed = content.trim();

    if (!trimmed) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit?.(trimmed);
      setContent("");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Paper
      withBorder
      radius={8}
      p="sm"
      bg="var(--card)"
      style={{ borderColor: "var(--border)" }}
    >
      <Group align="flex-start" wrap="nowrap">
        <Avatar radius="xl" color="green">
          B
        </Avatar>
        <Textarea
          value={content}
          onChange={(event) => setContent(event.currentTarget.value)}
          placeholder={placeholder}
          autosize
          minRows={2}
          maxRows={6}
          variant="unstyled"
          styles={{
            input: {
              color: "var(--foreground)",
            },
          }}
          style={{ flex: 1 }}
        />
        <RippleButton
          aria-label="Publier le commentaire"
          title="Publier"
          type="button"
          rippleColor="#000000"
          disabled={!content.trim() || isSubmitting}
          onClick={handleSubmit}
          className="size-10 shrink-0 rounded-full border-0 bg-breezy-green p-0 text-black shadow-lg shadow-breezy-green/20 transition-colors hover:bg-breezy-green/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiSend size={18} />
        </RippleButton>
      </Group>
    </Paper>
  );
}
