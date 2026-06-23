"use client";

import { io, type Socket } from "socket.io-client";

export type ChatSocket = Socket;

export type ChatConnectedPayload = {
  userId: string;
  onlineUserIds: string[];
};

export type PresencePayload = {
  userId: string;
};

export type PrivateMessagePayload = {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  sentAt: string;
  clientMessageId?: string;
};

export type PrivateMessageSentPayload = {
  message: PrivateMessagePayload;
  delivered: boolean;
};

function getChatBaseUrl() {
  if (process.env.NEXT_PUBLIC_CHAT_URL) {
    return process.env.NEXT_PUBLIC_CHAT_URL;
  }

  return typeof window !== "undefined" ? window.location.origin : "";
}

export function createChatSocket() {
  return io(getChatBaseUrl(), {
    path: process.env.NEXT_PUBLIC_CHAT_SOCKET_PATH ?? "/chat/socket.io",
    withCredentials: true,
    autoConnect: true,
  });
}
