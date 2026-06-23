"use client";

import { ActionIcon, Alert, Avatar, Loader, TextInput, Tooltip } from "@mantine/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FiMessageCircle, FiSearch, FiTrash2 } from "react-icons/fi";

import ChatStatusDot from "@/components/chat/ChatStatusDot";
import { getCurrentUserFromApi } from "@/lib/api/current-user.service";
import {
  getProfileById,
  getProfiles,
  type PublicProfile,
} from "@/lib/api/profile.service";
import {
  createChatSocket,
  type ChatConnectedPayload,
  type PresencePayload,
  type PrivateMessagePayload,
} from "@/lib/chat/chat-socket";
import {
  clearStoredConversation,
  loadStoredConversations,
  saveChatMessage,
  type StoredConversation,
} from "@/lib/chat/chat-storage";
import { getAuthenticatedUserId } from "@/lib/current-user-ids";

type PageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      currentUserId: string;
      profiles: PublicProfile[];
      conversations: StoredConversation[];
    };

function displayName(profile: PublicProfile) {
  return profile.nickname || profile.username;
}

function fallbackProfile(userId: string): PublicProfile {
  return {
    id_user: userId,
    username: userId.slice(0, 12),
    nickname: "",
    bio: "",
    url_photo: "",
    createdAt: "",
    updatedAt: "",
  };
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function ChatInboxClient() {
  const router = useRouter();
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const currentUserId = state.status === "ready" ? state.currentUserId : null;

  function handleClearConversation(peerUserId: string) {
    if (state.status !== "ready") {
      return;
    }

    clearStoredConversation(state.currentUserId, peerUserId);
    setState((current) =>
      current.status === "ready"
        ? {
            ...current,
            conversations: loadStoredConversations(current.currentUserId),
          }
        : current
    );
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [currentUser, initialProfiles] = await Promise.all([
          getCurrentUserFromApi(),
          getProfiles(),
        ]);
        const currentUserId = getAuthenticatedUserId(currentUser);
        const conversations = loadStoredConversations(currentUserId);
        const initialProfileIds = new Set(
          initialProfiles.map((profile) => profile.id_user)
        );
        const missingProfileIds = conversations
          .map((conversation) => conversation.userId)
          .filter((userId) => userId !== currentUserId && !initialProfileIds.has(userId));
        const missingProfiles = await Promise.all(
          missingProfileIds.map((userId) => getProfileById(userId).catch(() => null))
        );
        const profiles = [
          ...initialProfiles,
          ...missingProfiles.filter(
            (profile): profile is PublicProfile => profile !== null
          ),
        ];

        if (cancelled) {
          return;
        }

        setState({
          status: "ready",
          currentUserId,
          profiles: profiles.filter((profile) => profile.id_user !== currentUserId),
          conversations,
        });
      } catch {
        if (!cancelled) {
          router.replace("/login?redirect=/chat");
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const socket = createChatSocket();

    const refreshConversations = () => {
      setState((current) =>
        current.status === "ready"
          ? {
              ...current,
              conversations: loadStoredConversations(current.currentUserId),
            }
          : current
      );
    };

    socket.on("chat:connected", (payload: ChatConnectedPayload) => {
      setOnlineUserIds(new Set(payload.onlineUserIds));
    });
    socket.on("presence:online", (payload: PresencePayload) => {
      setOnlineUserIds((current) => new Set(current).add(payload.userId));
    });
    socket.on("presence:offline", (payload: PresencePayload) => {
      setOnlineUserIds((current) => {
        const next = new Set(current);
        next.delete(payload.userId);
        return next;
      });
    });
    socket.on("private-message", (message: PrivateMessagePayload) => {
      saveChatMessage(currentUserId, message.fromUserId, message, {
        markUnread: true,
      });
      refreshConversations();
    });

    socket.emit(
      "presence:list",
      (response: { onlineUserIds?: string[] } | undefined) => {
        setOnlineUserIds(new Set(response?.onlineUserIds ?? []));
      }
    );

    return () => {
      socket.disconnect();
    };
  }, [currentUserId]);

  const items = useMemo(() => {
    if (state.status !== "ready") {
      return [];
    }

    const profileByUserId = new Map(
      state.profiles.map((profile) => [profile.id_user, profile])
    );
    const normalizedQuery = query.trim().toLowerCase();

    return state.conversations
      .filter((conversation) => Boolean(conversation.lastMessage))
      .map((conversation) => ({
        profile:
          profileByUserId.get(conversation.userId) ?? fallbackProfile(conversation.userId),
        conversation,
        online: onlineUserIds.has(conversation.userId),
      }))
      .filter(({ profile }) => {
        if (!normalizedQuery) {
          return true;
        }

        return (
          profile.username.toLowerCase().includes(normalizedQuery) ||
          displayName(profile).toLowerCase().includes(normalizedQuery)
        );
      })
      .sort((a, b) => {
        const aTime = Date.parse(a.conversation?.updatedAt ?? "");
        const bTime = Date.parse(b.conversation?.updatedAt ?? "");

        if (!Number.isNaN(aTime) || !Number.isNaN(bTime)) {
          return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
        }

        if (a.online !== b.online) {
          return a.online ? -1 : 1;
        }

        return displayName(a.profile).localeCompare(displayName(b.profile), "fr");
      });
  }, [onlineUserIds, query, state]);

  if (state.status === "loading") {
    return (
      <section className="min-h-[calc(100svh-64px)] px-5 py-8">
        <div className="mx-auto flex max-w-3xl justify-center py-16">
          <Loader color="green" />
        </div>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="min-h-[calc(100svh-64px)] px-5 py-8">
        <div className="mx-auto max-w-3xl">
          <Alert color="red" variant="light">
            {state.message}
          </Alert>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100svh-64px)] px-5 py-8 text-foreground md:min-h-svh">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Messages</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Conversations privees ephemeres
            </p>
          </div>
          <FiMessageCircle className="size-6 text-breezy-green" aria-hidden />
        </div>

        <TextInput
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          leftSection={<FiSearch size={16} />}
          placeholder="Rechercher une conversation"
          radius={8}
          mb="md"
        />

        <div className="overflow-hidden rounded-lg border border-border bg-card/80">
          {items.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              Aucune conversation pour le moment.
            </p>
          ) : (
            items.map(({ profile, conversation, online }) => {
              const profileName = displayName(profile);

              return (
                <div
                  key={profile.id_user}
                  className="flex items-center border-b border-border last:border-b-0"
                >
                  <Link
                    href={`/chat/${encodeURIComponent(profile.id_user)}`}
                    className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 transition-colors hover:bg-accent"
                  >
                    <Avatar
                      src={profile.url_photo || null}
                      alt={profileName}
                      radius="xl"
                      size={44}
                    >
                      {profileName.slice(0, 2).toUpperCase()}
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{profileName}</p>
                        <ChatStatusDot online={online} />
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        @{profile.username}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground">
                        {conversation?.updatedAt ? formatTime(conversation.updatedAt) : ""}
                      </span>
                      {conversation && conversation.unreadCount > 0 && (
                        <span className="min-w-5 rounded-full bg-breezy-green px-1.5 text-center text-xs font-bold text-black">
                          {conversation.unreadCount > 99
                            ? "99+"
                            : conversation.unreadCount}
                        </span>
                      )}
                      {!conversation && (
                        <span className="text-xs text-muted-foreground">
                          {online ? "Connecte" : "Deconnecte"}
                        </span>
                      )}
                    </div>
                  </Link>

                  <Tooltip label="Effacer la conversation">
                    <ActionIcon
                      aria-label={`Effacer la conversation avec ${profileName}`}
                      className="mr-3 shrink-0"
                      color="red"
                      radius="xl"
                      size="md"
                      variant="subtle"
                      onClick={() => handleClearConversation(profile.id_user)}
                    >
                      <FiTrash2 size={16} />
                    </ActionIcon>
                  </Tooltip>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
