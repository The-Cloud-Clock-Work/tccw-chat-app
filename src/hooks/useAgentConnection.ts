import { useState, useCallback } from "react";
import type { AgentConnector, Message } from "../types";

export function useAgentConnection(connector: AgentConnector, fingerprint: string) {
  const [sending, setSending] = useState(false);

  const sendMessage = useCallback(
    async (
      content: string,
      conversationId: string,
      onResponse: (msg: Message) => void
    ) => {
      setSending(true);
      try {
        const response = await connector.sendMessage(content, conversationId, fingerprint);
        onResponse({
          id: `a-${Date.now()}`,
          role: "assistant",
          content: response.error ?? response.content,
          timestamp: new Date(),
          tools: response.tools,
          error: !!response.error,
        });
      } catch (e) {
        onResponse({
          id: `a-${Date.now()}`,
          role: "assistant",
          content: e instanceof Error ? e.message : "Something went wrong.",
          timestamp: new Date(),
          error: true,
        });
      } finally {
        setSending(false);
      }
    },
    [connector, fingerprint]
  );

  return { sending, sendMessage };
}
