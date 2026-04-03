import { useState, useCallback, useEffect } from "react";
import type { ChatAppConfig } from "./types";
import { ChatThemeProvider } from "./theme/ChatThemeProvider";
import { ChatCtx, type ChatContextValue } from "./ChatContext";
import { useFingerprint } from "./hooks/useFingerprint";
import { useConversations } from "./hooks/useConversations";
import { useAgentConnection } from "./hooks/useAgentConnection";
import { ChatBubble } from "./components/ChatBubble";
import { ChatWindow } from "./components/ChatWindow";

interface Props {
  config: ChatAppConfig;
}

export function ChatApp({ config }: Props) {
  const fingerprint = useFingerprint(config.fingerprint);
  const convState = useConversations(fingerprint, config.welcomeMessage);
  const { sending, sendMessage } = useAgentConnection(config.agentConnector, fingerprint);

  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  useEffect(() => {
    config.agentConnector.onConnect?.(fingerprint).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint]);

  const sendUserMessage = useCallback(
    (content: string) => {
      if (sending) return;
      const userMsg = {
        id: `u-${Date.now()}`,
        role: "user" as const,
        content,
        timestamp: new Date(),
      };
      convState.addMessage(userMsg);
      sendMessage(content, convState.activeConvId, (assistantMsg) => {
        convState.addMessage(assistantMsg);
      });
    },
    [sending, convState.addMessage, convState.activeConvId, sendMessage]
  );

  const ctx: ChatContextValue = {
    config,
    fingerprint,
    open,
    setOpen,
    expanded,
    setExpanded,
    showHistory,
    setShowHistory,
    ...convState,
    sending,
    sendUserMessage,
  };

  return (
    <ChatThemeProvider theme={config.theme}>
      <ChatCtx.Provider value={ctx}>
        {open ? <ChatWindow /> : <ChatBubble />}
      </ChatCtx.Provider>
    </ChatThemeProvider>
  );
}
