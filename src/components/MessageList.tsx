import { useRef, useEffect } from "react";
import { Bot, Loader2 } from "lucide-react";
import { useChatContext } from "../ChatContext";
import { MessageBubble } from "./MessageBubble";

export function MessageList() {
  const { activeConv, sending } = useChatContext();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv.messages.length, sending]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="space-y-4">
        {activeConv.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {sending && (
          <div className="flex gap-2">
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5"
              style={{ backgroundColor: "var(--chat-brand-subtle)" }}
            >
              <Bot className="h-3 w-3" style={{ color: "var(--chat-brand-text)" }} />
            </div>
            <div
              className="flex items-center gap-2 rounded-2xl rounded-bl-md px-3 py-2"
              style={{
                backgroundColor: "var(--chat-glass-bg)",
                border: "1px solid var(--chat-glass-border)",
              }}
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "var(--chat-brand-text)" }} />
              <span className="text-[11px]" style={{ color: "var(--chat-muted)" }}>
                Thinking...
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
