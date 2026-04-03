import { useState } from "react";
import { Send } from "lucide-react";
import { useChatContext } from "../ChatContext";

export function MessageInput() {
  const { sendUserMessage, sending, config } = useChatContext();
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim() || sending) return;
    sendUserMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shrink-0 p-3" style={{ borderTop: "1px solid var(--chat-glass-border)" }}>
      <div
        className="flex items-end gap-2.5 rounded-xl px-3 py-2"
        style={{ border: "1px solid var(--chat-glass-border)", backgroundColor: "rgba(255,255,255,0.03)" }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={config.placeholder ?? "Message..."}
          rows={1}
          className="max-h-20 flex-1 resize-none bg-transparent text-[13px] placeholder:opacity-50 outline-none py-1"
          style={{ color: "var(--chat-fg)" }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white transition-all disabled:opacity-20"
          style={{ backgroundColor: "var(--chat-brand)" }}
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
