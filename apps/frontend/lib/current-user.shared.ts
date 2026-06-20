export type CurrentUser = {
  auth: {
    id: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
  user: {
    id_user: string;
    role: "USER" | "MODERATOR" | "ADMIN";
    statuts: "ACTIVE" | "INACTIVE";
  } | null;
  profile: {
    id_user: string;
    username: string;
    nickname: string;
    bio: string;
    url_photo: string;
    createdAt: string;
    updatedAt: string;
  } | null;
};

export function resolveCurrentUserId(user: CurrentUser): string {
  return user.profile?.id_user ?? user.user?.id_user ?? user.auth.id;
}
