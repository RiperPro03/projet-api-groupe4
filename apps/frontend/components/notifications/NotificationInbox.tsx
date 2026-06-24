"use client";

import { Alert, Group, Loader } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";
import InboxNotificationList from "@/components/notifications/InboxNotificationList";
import { getCurrentUserFromApi } from "@/lib/api/current-user.service";
import { fetchUserNotifications } from "@/lib/api/notification.service";
import { useI18n } from "@/lib/i18n/client";

export default function NotificationInbox() {
  const { t } = useI18n();
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getCurrentUserFromApi()
      .then((currentUser) => {
        if (!isMounted) {
          return;
        }

        setUserId(currentUser.auth.id);
      })
      .catch(() => {
        if (isMounted) {
          setError(t("api.currentUserVerifyError"));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingUser(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [t]);

  const fetchNotifications = useMemo(() => {
    return userId ? fetchUserNotifications(userId) : null;
  }, [userId]);

  if (isLoadingUser) {
    return (
      <Group justify="center" py="xl">
        <Loader color="green" />
      </Group>
    );
  }

  if (error || !fetchNotifications || !userId) {
    return (
      <Alert color="red" variant="light">
        {error ?? t("api.userNotFound")}
      </Alert>
    );
  }

  return (
    <InboxNotificationList
      fetchNotifications={fetchNotifications}
      recipientId={userId}
    />
  );
}
