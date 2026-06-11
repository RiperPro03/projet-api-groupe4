export type CurrentUserResponse = {
  status: "success";
  data: {
    auth: {
      id: string;
      email: string;
      createdAt: string;
      updatedAt: string;
    };
    user: {
      id_user: string;
      role: "USER" | "MODERATOR" | "ADMIN";
      statuts: "ACTIVE" | "SUSPENDED" | "BANNED";
    };
    profile: {
      id_user: string;
      username: string;
      nickname: string;
      bio: string;
      url_photo: string;
      createdAt: string;
      updatedAt: string;
    };
  };
};

export const connectedUser = {
  status: "success",
  data: {
    auth: {
      id: "99b54026-3a88-49ee-a6c9-e62fe99720e1",
      email: "gateway-1781104858179@example.com",
      createdAt: "2026-06-10T15:20:58.390Z",
      updatedAt: "2026-06-10T15:20:58.390Z",
    },
    user: {
      id_user: "99b54026-3a88-49ee-a6c9-e62fe99720e1",
      role: "USER",
      statuts: "ACTIVE",
    },
    profile: {
      id_user: "99b54026-3a88-49ee-a6c9-e62fe99720e1",
      username: "gateway_1781104858179",
      nickname: "Gateway",
      bio: "Profil cree via la gateway",
      url_photo: "https://example.com/avatar.png",
      createdAt: "2026-06-10T15:20:58.416Z",
      updatedAt: "2026-06-10T15:20:58.416Z",
    },
  },
} satisfies CurrentUserResponse;
