import { clsx } from "clsx";
import { useChatContext } from "../ChatContext";
import { ChatHeader } from "./ChatHeader";
import { ConversationList } from "./ConversationList";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";

export function ChatWindow() {
  const { expanded, showHistory, config } = useChatContext();
  const z = config.zIndex ?? 30;
  const pos = config.position === "bottom-left" ? "sm:left-4" : "sm:right-4";

  const sizeClasses = expanded
    ? `inset-4 rounded-2xl sm:inset-auto sm:bottom-4 ${pos} sm:w-[680px] sm:h-[700px] sm:rounded-2xl`
    : `inset-x-4 bottom-4 top-auto h-[55vh] rounded-2xl sm:inset-auto sm:bottom-4 ${pos} sm:h-[520px] sm:w-[400px] sm:rounded-2xl`;

  return (
    <div
      className={clsx(
        "fixed flex flex-col overflow-hidden backdrop-blur-2xl transition-all duration-300 ease-out",
        sizeClasses
      )}
      style={{
        zIndex: z,
        backgroundColor: "color-mix(in srgb, var(--chat-surface) 92%, transparent)",
        border: "1px solid var(--chat-glass-border-hi)",
        boxShadow: "var(--chat-glass-shadow)",
        color: "var(--chat-fg)",
      }}
    >
      <ChatHeader />
      {showHistory ? <ConversationList /> : <MessageList />}
      {!showHistory && <MessageInput />}
    </div>
  );
}
