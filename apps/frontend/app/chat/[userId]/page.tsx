import type { Metadata } from "next";

import ChatRoomClient from "@/components/chat/ChatRoomClient";

export const metadata: Metadata = {
  title: "Conversation - Breezyl",
  description: "Chat prive ephemere.",
};

export default function ChatRoomPage() {
  return <ChatRoomClient />;
}
