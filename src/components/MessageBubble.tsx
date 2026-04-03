import { clsx } from "clsx";
import { Bot, User } from "lucide-react";
import type { Message } from "../types";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={clsx("flex gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5"
          style={{ backgroundColor: "var(--chat-brand-subtle)" }}
        >
          <Bot className="h-3 w-3" style={{ color: "var(--chat-brand-text)" }} />
        </div>
      )}
      <div
        className={clsx(
          "max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser ? "rounded-br-md text-white" : "rounded-bl-md"
        )}
        style={
          isUser
            ? { backgroundColor: "var(--chat-brand)" }
            : {
                backgroundColor: "var(--chat-glass-bg)",
                border: "1px solid var(--chat-glass-border)",
                color: "var(--chat-fg)",
              }
        }
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.tools && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {message.tools.map((t) => (
              <span key={t} className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-mono">
                {t}
              </span>
            ))}
          </div>
        )}
        <p className={clsx("mt-1 text-[9px]", isUser ? "text-white/40" : "")} style={!isUser ? { color: "var(--chat-muted)" } : undefined}>
          {formatTime(message.timestamp)}
        </p>
      </div>
      {isUser && (
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-0.5"
          style={{ backgroundColor: "var(--chat-surface-card)" }}
        >
          <User className="h-3 w-3" style={{ color: "var(--chat-muted)" }} />
        </div>
      )}
    </div>
  );
}
