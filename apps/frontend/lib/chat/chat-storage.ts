"use client";

export type ChatMessage = {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  sentAt: string;
  delivered?: boolean;
  clientMessageId?: string;
};

export type StoredConversation = {
  userId: string;
  lastMessage?: ChatMessage;
  updatedAt: string;
  unreadCount: number;
};

const storagePrefix = "breezy.chat";
export const CHAT_STORAGE_CHANGE_EVENT = "breezy.chat.changed";

function conversationKey(currentUserId: string, peerUserId: string) {
  return `${storagePrefix}.messages.${currentUserId}.${peerUserId}`;
}

function conversationsKey(currentUserId: string) {
  return `${storagePrefix}.conversations.${currentUserId}`;
}

function messageKeyPrefix(currentUserId: string) {
  return `${storagePrefix}.messages.${currentUserId}.`;
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function notifyChatStorageChanged(currentUserId: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(CHAT_STORAGE_CHANGE_EVENT, {
      detail: { currentUserId },
    })
  );
}

export function loadChatMessages(currentUserId: string, peerUserId: string) {
  if (!canUseStorage()) {
    return [];
  }

  return parseJson<ChatMessage[]>(
    window.localStorage.getItem(conversationKey(currentUserId, peerUserId)),
    []
  );
}

export function saveChatMessage(
  currentUserId: string,
  peerUserId: string,
  message: ChatMessage,
  options: { markUnread?: boolean } = {}
) {
  if (!canUseStorage()) {
    return;
  }

  const messages = loadChatMessages(currentUserId, peerUserId);
  const alreadyStored = messages.some((item) => item.id === message.id);

  if (!alreadyStored) {
    messages.push(message);
  }

  window.localStorage.setItem(
    conversationKey(currentUserId, peerUserId),
    JSON.stringify(messages.slice(-150))
  );
  upsertStoredConversation(currentUserId, peerUserId, message, {
    ...options,
    markUnread: Boolean(options.markUnread && !alreadyStored),
  });
}

export function loadStoredConversations(currentUserId: string) {
  if (!canUseStorage()) {
    return [];
  }

  const conversations = parseJson<StoredConversation[]>(
    window.localStorage.getItem(conversationsKey(currentUserId)),
    []
  );

  const conversationByUserId = new Map(
    conversations.map((conversation) => [conversation.userId, conversation])
  );
  const prefix = messageKeyPrefix(currentUserId);

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (!key?.startsWith(prefix)) {
      continue;
    }

    const peerUserId = key.slice(prefix.length);
    const messages = parseJson<ChatMessage[]>(window.localStorage.getItem(key), []);
    const lastMessage = messages.at(-1);

    if (!lastMessage) {
      continue;
    }

    const existing = conversationByUserId.get(peerUserId);
    conversationByUserId.set(peerUserId, {
      userId: peerUserId,
      lastMessage,
      updatedAt: lastMessage.sentAt,
      unreadCount: existing?.unreadCount ?? 0,
    });
  }

  return Array.from(conversationByUserId.values()).sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
  );
}

export function getTotalUnreadChatCount(currentUserId: string) {
  return loadStoredConversations(currentUserId).reduce(
    (total, conversation) => total + Math.max(0, conversation.unreadCount),
    0
  );
}

export function upsertStoredConversation(
  currentUserId: string,
  peerUserId: string,
  lastMessage?: ChatMessage,
  options: { markUnread?: boolean } = {}
) {
  if (!canUseStorage()) {
    return;
  }

  const conversations = loadStoredConversations(currentUserId);
  const existing = conversations.find((item) => item.userId === peerUserId);
  const nextLastMessage = lastMessage ?? existing?.lastMessage;
  const updatedAt =
    nextLastMessage?.sentAt ?? existing?.updatedAt ?? new Date().toISOString();

  const nextConversation: StoredConversation = {
    userId: peerUserId,
    lastMessage: nextLastMessage,
    updatedAt,
    unreadCount: options.markUnread
      ? (existing?.unreadCount ?? 0) + 1
      : existing?.unreadCount ?? 0,
  };

  const nextConversations = [
    nextConversation,
    ...conversations.filter((item) => item.userId !== peerUserId),
  ].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

  window.localStorage.setItem(
    conversationsKey(currentUserId),
    JSON.stringify(nextConversations)
  );
  notifyChatStorageChanged(currentUserId);
}

export function markConversationRead(currentUserId: string, peerUserId: string) {
  if (!canUseStorage()) {
    return;
  }

  const conversations = loadStoredConversations(currentUserId).map((conversation) =>
    conversation.userId === peerUserId
      ? { ...conversation, unreadCount: 0 }
      : conversation
  );

  window.localStorage.setItem(
    conversationsKey(currentUserId),
    JSON.stringify(conversations)
  );
  notifyChatStorageChanged(currentUserId);
}

export function clearStoredConversation(currentUserId: string, peerUserId: string) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(conversationKey(currentUserId, peerUserId));

  const conversations = loadStoredConversations(currentUserId).filter(
    (conversation) => conversation.userId !== peerUserId
  );

  window.localStorage.setItem(
    conversationsKey(currentUserId),
    JSON.stringify(conversations)
  );
  notifyChatStorageChanged(currentUserId);
}
