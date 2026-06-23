"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import {
  createChatSocket,
  type PrivateMessagePayload,
} from "@/lib/chat/chat-socket";
import { markConversationRead, saveChatMessage } from "@/lib/chat/chat-storage";

type ChatPresenceClientProps = {
  currentUserId: string | null;
};

function getOpenChatPeerUserId(pathname: string) {
  if (!pathname.startsWith("/chat/")) {
    return null;
  }

  const peerUserId = pathname.split("/")[2];

  if (!peerUserId) {
    return null;
  }

  try {
    return decodeURIComponent(peerUserId);
  } catch {
    return peerUserId;
  }
}

export default function ChatPresenceClient({
  currentUserId,
}: ChatPresenceClientProps) {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const socket = createChatSocket();

    socket.on("private-message", (message: PrivateMessagePayload) => {
      const openPeerUserId = getOpenChatPeerUserId(pathnameRef.current);
      const isOpenConversation = openPeerUserId === message.fromUserId;

      saveChatMessage(currentUserId, message.fromUserId, message, {
        markUnread: !isOpenConversation,
      });

      if (isOpenConversation) {
        markConversationRead(currentUserId, message.fromUserId);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUserId]);

  return null;
}
