import { useState, useCallback } from "react";
import type { Conversation, Message } from "../types";

const storageKey = (fp: string) => `chat-app:conversations:${fp}`;

function makeWelcomeConversation(welcomeMessage?: string): Conversation {
  return {
    id: `conv-${Date.now()}`,
    title: "New conversation",
    createdAt: new Date(),
    messages: [
      {
        id: `m-${Date.now()}`,
        role: "assistant",
        content: welcomeMessage ?? "Hello! How can I help you?",
        timestamp: new Date(),
      },
    ],
  };
}

function loadFromStorage(fingerprint: string, welcomeMessage?: string): Conversation[] {
  if (typeof window === "undefined") return [makeWelcomeConversation(welcomeMessage)];
  try {
    const raw = localStorage.getItem(storageKey(fingerprint));
    if (!raw) return [makeWelcomeConversation(welcomeMessage)];
    const parsed = JSON.parse(raw) as Conversation[];
    return parsed.map((c) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      messages: c.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })),
    }));
  } catch {
    return [makeWelcomeConversation(welcomeMessage)];
  }
}

function saveToStorage(fingerprint: string, convs: Conversation[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(fingerprint), JSON.stringify(convs));
  } catch { /* quota exceeded */ }
}

export function useConversations(fingerprint: string, welcomeMessage?: string) {
  const [conversations, setConversationsRaw] = useState<Conversation[]>(() =>
    loadFromStorage(fingerprint, welcomeMessage)
  );
  const [activeConvId, setActiveConvId] = useState(conversations[0].id);

  const setConversations = useCallback(
    (updater: (prev: Conversation[]) => Conversation[]) => {
      setConversationsRaw((prev) => {
        const next = updater(prev);
        saveToStorage(fingerprint, next);
        return next;
      });
    },
    [fingerprint]
  );

  const activeConv = conversations.find((c) => c.id === activeConvId) ?? conversations[0];

  const addMessage = useCallback(
    (msg: Message) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId
            ? {
                ...c,
                title: c.messages.length <= 1 && msg.role === "user" ? msg.content.slice(0, 40) : c.title,
                messages: [...c.messages, msg],
              }
            : c
        )
      );
    },
    [activeConvId, setConversations]
  );

  const newConversation = useCallback(() => {
    const current = conversations.find((c) => c.id === activeConvId);
    if (current && !current.messages.some((m) => m.role === "user")) return;
    const conv = makeWelcomeConversation(welcomeMessage);
    setConversations((prev) => [conv, ...prev]);
    setActiveConvId(conv.id);
  }, [conversations, activeConvId, setConversations, welcomeMessage]);

  const clearConversation = useCallback(() => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? {
              ...c,
              messages: [
                { id: `m-${Date.now()}`, role: "assistant" as const, content: "Conversation cleared. How can I help?", timestamp: new Date() },
              ],
            }
          : c
      )
    );
  }, [activeConvId, setConversations]);

  const deleteConv = useCallback(
    (convId: string) => {
      setConversations((prev) => {
        const filtered = prev.filter((c) => c.id !== convId);
        if (filtered.length === 0) return [makeWelcomeConversation(welcomeMessage)];
        return filtered;
      });
      if (activeConvId === convId) {
        const remaining = conversations.filter((c) => c.id !== convId);
        setActiveConvId(remaining[0]?.id ?? "");
      }
    },
    [activeConvId, conversations, setConversations, welcomeMessage]
  );

  const deleteAll = useCallback(() => {
    if (typeof window !== "undefined" && !confirm("Delete all conversation history?")) return;
    const fresh = makeWelcomeConversation(welcomeMessage);
    setConversations(() => [fresh]);
    setActiveConvId(fresh.id);
  }, [setConversations, welcomeMessage]);

  return {
    conversations,
    activeConv,
    activeConvId,
    setActiveConvId,
    addMessage,
    newConversation,
    clearConversation,
    deleteConversation: deleteConv,
    deleteAllHistory: deleteAll,
  };
}
