import { ChevronLeft, Clock, Plus, Trash2, Minimize2, Maximize2, X, Bot } from "lucide-react";
import { useChatContext } from "../ChatContext";

function HeaderButton({ onClick, title, children, danger }: { onClick: () => void; title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg p-1.5 transition-colors hover:bg-white/5 ${danger ? "hover:text-red-400 hover:bg-red-500/10" : ""}`}
      style={{ color: danger ? "rgba(248,113,113,0.6)" : "var(--chat-muted)" }}
      title={title}
    >
      {children}
    </button>
  );
}

export function ChatHeader() {
  const {
    config,
    showHistory,
    setShowHistory,
    expanded,
    setExpanded,
    setOpen,
    newConversation,
    clearConversation,
    deleteAllHistory,
  } = useChatContext();

  if (showHistory) {
    return (
      <div
        className="flex h-14 shrink-0 items-center justify-between px-4"
        style={{ borderBottom: "1px solid var(--chat-glass-border)" }}
      >
        <HeaderButton onClick={() => setShowHistory(false)} title="Back">
          <ChevronLeft className="h-4 w-4" />
        </HeaderButton>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--chat-muted)" }}>
          History
        </span>
        <div className="flex items-center gap-0.5">
          <HeaderButton onClick={newConversation} title="New conversation">
            <Plus className="h-4 w-4" />
          </HeaderButton>
          <HeaderButton onClick={deleteAllHistory} title="Delete all history" danger>
            <Trash2 className="h-4 w-4" />
          </HeaderButton>
        </div>
      </div>
    );
  }

  const logo = config.logo;
  const renderLogo = () => {
    if (!logo) return <Bot className="h-5 w-5" style={{ color: "var(--chat-brand-text)" }} />;
    if (typeof logo === "string") return <img src={logo} alt="" className="h-6 w-6 rounded-md" />;
    return <>{logo}</>;
  };

  return (
    <div
      className="flex h-14 shrink-0 items-center justify-between px-4"
      style={{ borderBottom: "1px solid var(--chat-glass-border)" }}
    >
      <div className="flex items-center gap-2">
        {renderLogo()}
        {config.title && (
          <span className="text-xs font-semibold" style={{ color: "var(--chat-fg)" }}>
            {config.title}
          </span>
        )}
        <span className="rounded-full bg-green-500/20 px-1.5 py-0.5 text-[9px] font-medium text-green-400">
          online
        </span>
      </div>
      <div className="flex items-center gap-0.5">
        <HeaderButton onClick={() => setShowHistory(true)} title="Conversation history">
          <Clock className="h-3.5 w-3.5" />
        </HeaderButton>
        <HeaderButton onClick={newConversation} title="New session">
          <Plus className="h-3.5 w-3.5" />
        </HeaderButton>
        <HeaderButton onClick={clearConversation} title="Clear conversation">
          <Trash2 className="h-3.5 w-3.5" />
        </HeaderButton>
        <HeaderButton onClick={() => setExpanded(!expanded)} title={expanded ? "Compact" : "Expand"}>
          {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </HeaderButton>
        <HeaderButton onClick={() => setOpen(false)} title="Close (ESC)">
          <X className="h-3.5 w-3.5" />
        </HeaderButton>
      </div>
    </div>
  );
}
