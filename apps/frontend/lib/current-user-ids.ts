import type { CurrentUser } from "@/lib/current-user";

export function getAuthenticatedUserId(currentUser: CurrentUser) {
  return currentUser.auth.id;
}

export function getProfileUserId(currentUser: CurrentUser) {
  return (
    currentUser.profile?.id_user ??
    currentUser.user?.id_user ??
    currentUser.auth.id
  );
}
