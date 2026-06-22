import { getProfileById } from "@/lib/api/profile.service";
import type { UserNotification } from "@/types/notification";

function mapProfileToActor(profile: {
  id_user: string;
  username: string;
  nickname: string;
  url_photo: string;
}) {
  const username = profile.username?.trim() || profile.id_user.slice(0, 12);
  const name = profile.nickname?.trim() || username;

  return {
    id: profile.id_user,
    name,
    username,
    avatarUrl: profile.url_photo?.trim() || undefined,
  };
}

export async function enrichNotificationsWithActors(
  notifications: UserNotification[]
): Promise<UserNotification[]> {
  const actorIds = Array.from(
    new Set(notifications.map((notification) => notification.actorId).filter(Boolean))
  );

  if (actorIds.length === 0) {
    return notifications;
  }

  const actorEntries = await Promise.all(
    actorIds.map(async (actorId) => {
      const profile = await getProfileById(actorId).catch(() => null);
      return profile ? ([actorId, mapProfileToActor(profile)] as const) : null;
    })
  );

  const actorsById = new Map(
    actorEntries.filter((entry): entry is [string, NonNullable<typeof entry>[1]] =>
      entry !== null
    )
  );

  return notifications.map((notification) => ({
    ...notification,
    actor: actorsById.get(notification.actorId),
  }));
}
