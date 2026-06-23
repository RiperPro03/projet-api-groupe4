"use client";

import { Alert, Avatar, Loader, Textarea } from "@mantine/core";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiSend } from "react-icons/fi";

import ChatStatusDot from "@/components/chat/ChatStatusDot";
import { RippleButton } from "@/components/ui/ripple-button";
import { getCurrentUserFromApi } from "@/lib/api/current-user.service";
import { getProfileById, type PublicProfile } from "@/lib/api/profile.service";
import {
  createChatSocket,
  type ChatConnectedPayload,
  type PresencePayload,
  type PrivateMessagePayload,
  type PrivateMessageSentPayload,
} from "@/lib/chat/chat-socket";
import {
  loadChatMessages,
  markConversationRead,
  saveChatMessage,
  upsertStoredConversation,
  type ChatMessage,
} from "@/lib/chat/chat-storage";
import { getAuthenticatedUserId } from "@/lib/current-user-ids";

type PageState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      currentUserId: string;
      peer: PublicProfile;
      messages: ChatMessage[];
    };

function displayName(profile: PublicProfile) {
  return profile.nickname || profile.username;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function ChatRoomClient() {
  const params = useParams();
  const router = useRouter();
  const peerUserId = decodeURIComponent(params.userId as string);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<ReturnType<typeof createChatSocket> | null>(null);
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [input, setInput] = useState("");
  const [isPeerOnline, setIsPeerOnline] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const currentUserId = state.status === "ready" ? state.currentUserId : null;
  const peerId = state.status === "ready" ? state.peer.id_user : null;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const currentUser = await getCurrentUserFromApi();
        const currentUserId = getAuthenticatedUserId(currentUser);

        if (currentUserId === peerUserId) {
          router.replace("/chat");
          return;
        }

        const peer = await getProfileById(peerUserId);

        if (cancelled) {
          return;
        }

        if (!peer) {
          setState({ status: "not_found" });
          return;
        }

        upsertStoredConversation(currentUserId, peer.id_user);
        markConversationRead(currentUserId, peer.id_user);
        setState({
          status: "ready",
          currentUserId,
          peer,
          messages: loadChatMessages(currentUserId, peer.id_user),
        });
      } catch {
        if (!cancelled) {
          router.replace(`/login?redirect=/chat/${encodeURIComponent(peerUserId)}`);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [peerUserId, router]);

  useEffect(() => {
    if (!currentUserId || !peerId) {
      return;
    }

    const socket = createChatSocket();
    socketRef.current = socket;

    const appendMessage = (message: ChatMessage) => {
      saveChatMessage(currentUserId, peerId, message);
      markConversationRead(currentUserId, peerId);
      setState((current) =>
        current.status === "ready"
          ? {
              ...current,
              messages: loadChatMessages(current.currentUserId, current.peer.id_user),
            }
          : current
      );
    };

    socket.on("connect", () => setConnectionError(null));
    socket.on("connect_error", () => {
      setConnectionError("Connexion au chat indisponible.");
    });
    socket.on("chat:error", (error: { message?: string }) => {
      setConnectionError(error.message ?? "Impossible d'envoyer le message.");
    });
    socket.on("chat:connected", (payload: ChatConnectedPayload) => {
      setIsPeerOnline(payload.onlineUserIds.includes(peerId));
    });
    socket.on("presence:online", (payload: PresencePayload) => {
      if (payload.userId === peerId) {
        setIsPeerOnline(true);
      }
    });
    socket.on("presence:offline", (payload: PresencePayload) => {
      if (payload.userId === peerId) {
        setIsPeerOnline(false);
      }
    });
    socket.on("private-message", (message: PrivateMessagePayload) => {
      if (message.fromUserId === peerId) {
        appendMessage({
          ...message,
          delivered: true,
        });
      }
    });
    socket.on("private-message:sent", (payload: PrivateMessageSentPayload) => {
      if (payload.message.toUserId === peerId) {
        appendMessage({
          ...payload.message,
          delivered: payload.delivered,
        });
      }
    });

    socket.emit(
      "presence:list",
      (response: { onlineUserIds?: string[] } | undefined) => {
        setIsPeerOnline((response?.onlineUserIds ?? []).includes(peerId));
      }
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId, peerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [state]);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  function handleSend() {
    if (state.status !== "ready" || !canSend) {
      return;
    }

    const socket = socketRef.current;

    if (!socket?.connected) {
      setConnectionError("Connexion au chat indisponible.");
      return;
    }

    socket.emit("private-message", {
      toUserId: state.peer.id_user,
      content: input.trim(),
      clientMessageId: crypto.randomUUID(),
    });
    setInput("");
  }

  if (state.status === "loading") {
    return (
      <section className="min-h-[calc(100svh-64px)] px-5 py-8">
        <div className="mx-auto flex max-w-3xl justify-center py-16">
          <Loader color="green" />
        </div>
      </section>
    );
  }

  if (state.status === "not_found") {
    return (
      <section className="min-h-[calc(100svh-64px)] px-5 py-8 text-foreground">
        <div className="mx-auto max-w-3xl">
          <Alert color="red" variant="light">
            Conversation introuvable.
          </Alert>
          <Link className="mt-4 inline-block text-sm text-breezy-green" href="/chat">
            Retour aux messages
          </Link>
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

  const peerName = displayName(state.peer);

  return (
    <section className="flex min-h-[calc(100svh-64px)] flex-col text-foreground md:min-h-svh md:px-5 md:py-6">
      <div className="flex min-h-[calc(100svh-64px)] w-full flex-1 flex-col overflow-hidden bg-card/80 md:mx-auto md:min-h-[calc(100svh-112px)] md:max-w-3xl md:rounded-lg md:border md:border-border">
        <header className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Link
            href="/chat"
            aria-label="Retour aux messages"
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <FiArrowLeft className="size-5" aria-hidden />
          </Link>
          <Avatar src={state.peer.url_photo || null} alt={peerName} radius="xl" size={42}>
            {peerName.slice(0, 2).toUpperCase()}
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold">{peerName}</h1>
              <ChatStatusDot online={isPeerOnline} />
            </div>
            <p className="truncate text-xs text-muted-foreground">
              @{state.peer.username} - {isPeerOnline ? "Connecte" : "Deconnecte"}
            </p>
          </div>
        </header>

        {connectionError && (
          <Alert color="yellow" variant="light" radius={0}>
            {connectionError}
          </Alert>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
          {state.messages.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Aucun message local. Demarrez la conversation.
            </p>
          ) : (
            state.messages.map((message) => {
              const isOwn = message.fromUserId === state.currentUserId;

              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[78%] rounded-lg px-3 py-2 text-sm ${
                      isOwn
                        ? "bg-breezy-green text-black"
                        : "border border-border bg-background text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                    <p
                      className={`mt-1 text-[11px] ${
                        isOwn ? "text-black/65" : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(message.sentAt)}
                      {isOwn && message.delivered === false ? " - non remis" : ""}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form
          className="border-t border-border p-3"
          onSubmit={(event) => {
            event.preventDefault();
            handleSend();
          }}
        >
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.currentTarget.value)}
              placeholder="Votre message"
              autosize
              minRows={1}
              maxRows={5}
              radius={8}
              className="flex-1"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
            />
            <RippleButton
              type="submit"
              disabled={!canSend}
              rippleColor="var(--color-breezy-black)"
              className="h-10 rounded-full border-breezy-green bg-breezy-green px-4 text-black disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Envoyer"
            >
              <FiSend className="size-4" aria-hidden />
            </RippleButton>
          </div>
        </form>
      </div>
    </section>
  );
}
