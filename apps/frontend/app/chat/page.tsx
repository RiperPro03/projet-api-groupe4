import type { Metadata } from "next";

import ChatInboxClient from "@/components/chat/ChatInboxClient";

export const metadata: Metadata = {
  title: "Messages - Breezyl",
  description: "Conversations privees ephemeres.",
};

export default function ChatPage() {
  return <ChatInboxClient />;
}
