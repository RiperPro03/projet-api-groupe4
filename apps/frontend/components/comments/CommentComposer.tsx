"use client";

import { useState } from "react";
import { Avatar, Button, Group, Paper, Textarea } from "@mantine/core";
import { FiSend } from "react-icons/fi";

type CommentComposerProps = {
  placeholder?: string;
  onSubmit?: (content: string) => void | Promise<void>;
};

export default function CommentComposer({
  placeholder = "Ecrire un commentaire...",
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
      bg="rgba(9, 12, 11, 0.92)"
      style={{ borderColor: "rgba(255, 255, 255, 0.12)" }}
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
              color: "white",
            },
          }}
          style={{ flex: 1 }}
        />
        <Button
          aria-label="Publier le commentaire"
          title="Publier"
          radius="xl"
          color="green"
          px="sm"
          disabled={!content.trim()}
          loading={isSubmitting}
          onClick={handleSubmit}
        >
          <FiSend size={18} />
        </Button>
      </Group>
    </Paper>
  );
}
