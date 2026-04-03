import { clsx } from "clsx";
import { MessageSquare, Trash2 } from "lucide-react";
import { useChatContext } from "../ChatContext";

export function ConversationList() {
  const { conversations, activeConvId, setActiveConvId, setShowHistory, deleteConversation } = useChatContext();

  return (
    <div className="flex-1 overflow-y-auto p-2">
      {conversations.map((conv) => (
        <div
          key={conv.id}
          onClick={() => {
            setActiveConvId(conv.id);
            setShowHistory(false);
          }}
          className={clsx(
            "group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer",
            conv.id === activeConvId ? "text-white/90" : "hover:bg-white/5"
          )}
          style={
            conv.id === activeConvId
              ? { backgroundColor: "color-mix(in srgb, var(--chat-brand) 15%, transparent)" }
              : { color: "var(--chat-fg)" }
          }
        >
          <MessageSquare className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--chat-muted)" }} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{conv.title}</p>
            <p className="text-[10px]" style={{ color: "var(--chat-muted)" }}>
              {conv.messages.length} msgs
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteConversation(conv.id);
            }}
            className="shrink-0 rounded p-1 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-all"
            style={{ color: "var(--chat-muted)" }}
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
