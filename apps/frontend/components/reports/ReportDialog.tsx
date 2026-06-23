"use client";

import { Alert, Group, Modal, Stack, Text, Textarea } from "@mantine/core";
import { useEffect, useState } from "react";
import { FiFlag, FiSend } from "react-icons/fi";
import { RippleButton } from "@/components/ui/ripple-button";
import { useI18n } from "@/lib/i18n/client";

type ReportDialogProps = {
  opened: boolean;
  title: string;
  description: string;
  placeholder: string;
  error?: string | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void>;
};

const secondaryButtonClassName =
  "rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60";

const reportButtonClassName =
  "rounded-full border-0 bg-destructive px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-destructive/20 transition-colors hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60";

export function ReportDialog({
  opened,
  title,
  description,
  placeholder,
  error,
  isSubmitting = false,
  onClose,
  onSubmit,
}: ReportDialogProps) {
  const { t } = useI18n();
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!opened) {
        setMessage("");
      }
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [opened]);

  async function handleSubmit() {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isSubmitting) {
      return;
    }

    await onSubmit(trimmedMessage);
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      centered
      radius={8}
      closeOnClickOutside={!isSubmitting}
      closeOnEscape={!isSubmitting}
      overlayProps={{ backgroundOpacity: 0.72, blur: 2 }}
    >
      <Stack gap="md">
        <Group align="flex-start" gap="sm" wrap="nowrap">
          <FiFlag className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
          <Text size="sm" style={{ color: "var(--muted-foreground)" }}>
            {description}
          </Text>
        </Group>

        <Textarea
          value={message}
          onChange={(event) => setMessage(event.currentTarget.value)}
          placeholder={placeholder}
          minRows={4}
          maxRows={8}
          autosize
          disabled={isSubmitting}
          classNames={{
            input:
              "border-border bg-muted text-foreground placeholder:text-muted-foreground selection:bg-breezy-green/25 selection:text-foreground",
          }}
          styles={{
            wrapper: {
              "--input-bd-focus": "rgb(var(--breezy-green-rgb) / 0.65)",
            },
            input: {
              caretColor: "var(--color-breezy-green)",
            },
          }}
        />

        {error && (
          <Alert
            variant="light"
            style={{
              backgroundColor: "color-mix(in oklch, var(--destructive) 12%, transparent)",
              borderColor: "color-mix(in oklch, var(--destructive) 35%, transparent)",
              color: "var(--destructive)",
            }}
          >
            {error}
          </Alert>
        )}

        <Group justify="flex-end">
          <RippleButton
            type="button"
            rippleColor="var(--foreground)"
            disabled={isSubmitting}
            onClick={onClose}
            className={secondaryButtonClassName}
          >
            {t("common.cancel")}
          </RippleButton>
          <RippleButton
            type="button"
            rippleColor="var(--foreground)"
            disabled={!message.trim() || isSubmitting}
            onClick={handleSubmit}
            className={reportButtonClassName}
          >
            <span className="flex items-center gap-2">
              <FiSend size={16} />
              {isSubmitting ? t("report.sending") : t("report.submit")}
            </span>
          </RippleButton>
        </Group>
      </Stack>
    </Modal>
  );
}
