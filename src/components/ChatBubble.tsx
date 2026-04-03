import { MessageSquare } from "lucide-react";
import { useChatContext } from "../ChatContext";

export function ChatBubble() {
  const { setOpen, config } = useChatContext();
  const pos = config.position === "bottom-left" ? "left-4" : "right-4";
  const z = config.zIndex ?? 30;

  return (
    <button
      onClick={() => setOpen(true)}
      style={{
        zIndex: z,
        backgroundColor: "var(--chat-brand)",
        boxShadow: `0 10px 25px color-mix(in srgb, var(--chat-brand) 30%, transparent)`,
      }}
      className={`fixed bottom-4 ${pos} flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl border border-white/10 text-white transition-all duration-200 hover:scale-110`}
      title="Open AI Chat (ESC to close)"
    >
      <MessageSquare className="h-6 w-6" />
    </button>
  );
}
