import { createContext, useContext } from "react";
import type { ChatAppConfig, Conversation, Message } from "./types";

export interface ChatContextValue {
  config: ChatAppConfig;
  fingerprint: string;
  open: boolean;
  setOpen: (v: boolean) => void;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  showHistory: boolean;
  setShowHistory: (v: boolean) => void;
  conversations: Conversation[];
  activeConv: Conversation;
  activeConvId: string;
  setActiveConvId: (id: string) => void;
  addMessage: (msg: Message) => void;
  newConversation: () => void;
  clearConversation: () => void;
  deleteConversation: (id: string) => void;
  deleteAllHistory: () => void;
  sending: boolean;
  sendUserMessage: (content: string) => void;
}

export const ChatCtx = createContext<ChatContextValue | null>(null);

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatCtx);
  if (!ctx) throw new Error("useChatContext must be used within ChatApp");
  return ctx;
}
