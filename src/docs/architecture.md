# Architecture

## Component Hierarchy

```
ChatApp (root — accepts ChatAppConfig, creates context)
│
├── ChatThemeProvider (injects --chat-* CSS vars via inline style)
│
└── ChatCtx.Provider (distributes state to all descendants)
    │
    ├── [open=false] → ChatBubble
    │                    Fixed-position button (bottom-right or bottom-left)
    │                    Click → setOpen(true)
    │
    └── [open=true]  → ChatWindow
                       Fixed-position panel (compact or expanded)
                       │
                       ├── ChatHeader
                       │   ├── [showHistory=false] → Logo + Title + Status + Controls
                       │   │                         [History] [New] [Clear] [Expand] [Close]
                       │   │
                       │   └── [showHistory=true]  → Back + "History" + [New] [Delete All]
                       │
                       ├── [showHistory=false] → MessageList
                       │                         ├── MessageBubble × N (user or assistant)
                       │                         │   ├── Avatar (Bot icon or User icon)
                       │                         │   ├── Content (whitespace-pre-wrap)
                       │                         │   ├── Tool badges (optional)
                       │                         │   └── Timestamp
                       │                         │
                       │                         └── [sending=true] → Typing indicator
                       │
                       ├── [showHistory=true]  → ConversationList
                       │                         └── Conversation row × N
                       │                             ├── Title (truncated)
                       │                             ├── Message count
                       │                             └── Delete button (hover-reveal)
                       │
                       └── [showHistory=false] → MessageInput
                                                 ├── Textarea (Enter to send, Shift+Enter for newline)
                                                 └── Send button (disabled when empty or sending)
```

## Data Flow

```
                    ChatAppConfig
                         │
                         ▼
                 ┌───────────────┐
                 │   ChatApp     │
                 │               │
                 │  useFingerprint(config.fingerprint)
                 │       │
                 │       ▼ fingerprint: string
                 │
                 │  useConversations(fingerprint, config.welcomeMessage)
                 │       │
                 │       ▼ { conversations, activeConv, addMessage, newConversation, ... }
                 │
                 │  useAgentConnection(config.agentConnector, fingerprint)
                 │       │
                 │       ▼ { sending, sendMessage }
                 │
                 │  sendUserMessage = (content) => {
                 │    addMessage(userMsg)                    ← optimistic: user sees their message immediately
                 │    sendMessage(content, convId, (response) => {
                 │      addMessage(response)                ← after connector resolves
                 │    })
                 │  }
                 │
                 └──────┬────────┘
                        │
                   ChatCtx.Provider
                        │
            ┌───────────┼───────────┐
            ▼           ▼           ▼
        ChatBubble  ChatWindow  (all descendants)
                        │
                        ▼
                   useChatContext()   ← every component reads from context
```

## State Management

All state lives in `ChatApp.tsx` and is distributed via `ChatContext`:

| State | Type | Source | Persisted? |
|---|---|---|---|
| `open` | boolean | `useState(false)` | No |
| `expanded` | boolean | `useState(false)` | No |
| `showHistory` | boolean | `useState(false)` | No |
| `fingerprint` | string | `useFingerprint` | localStorage `chat-app:fingerprint` |
| `conversations` | Conversation[] | `useConversations` | localStorage `chat-app:conversations:{fp}` |
| `activeConvId` | string | `useConversations` | No (resets to first conversation on page load) |
| `sending` | boolean | `useAgentConnection` | No |

### Context Shape

```typescript
interface ChatContextValue {
  config: ChatAppConfig;
  fingerprint: string;

  // UI state
  open: boolean;
  setOpen: (v: boolean) => void;
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  showHistory: boolean;
  setShowHistory: (v: boolean) => void;

  // Conversation state
  conversations: Conversation[];
  activeConv: Conversation;
  activeConvId: string;
  setActiveConvId: (id: string) => void;
  addMessage: (msg: Message) => void;
  newConversation: () => void;
  clearConversation: () => void;
  deleteConversation: (id: string) => void;
  deleteAllHistory: () => void;

  // Agent state
  sending: boolean;
  sendUserMessage: (content: string) => void;
}
```

## Hook Responsibilities

### useFingerprint

```
Input:  override?: string (from config.fingerprint)
Output: fingerprint: string

Priority:
  1. override provided → use it
  2. localStorage has key → use stored
  3. generate crypto.randomUUID() → store → use
```

### useConversations

```
Input:  fingerprint: string, welcomeMessage?: string
Output: {
  conversations,          // all conversations
  activeConv,             // the currently selected conversation
  activeConvId,           // its ID
  setActiveConvId,        // switch conversation
  addMessage,             // append a message to active conversation
  newConversation,        // create new (guards against empty spam)
  clearConversation,      // reset active to single "cleared" message
  deleteConversation,     // remove by ID
  deleteAllHistory,       // confirm + wipe all
}

Persistence:
  - Reads from localStorage on init
  - Writes to localStorage on every mutation
  - Key: `chat-app:conversations:{fingerprint}`
  - Dates re-inflated from ISO strings on load
```

### useAgentConnection

```
Input:  connector: AgentConnector, fingerprint: string
Output: {
  sending: boolean,       // true while waiting for response
  sendMessage: (content, convId, onResponse) => void
}

Error handling:
  - AgentResponse.error → creates assistant message with error=true
  - Thrown exception → catches, creates error message with exception text
  - Never leaves sending=true on failure
```

## Message Lifecycle

```
1. User types "what are my signals?" and presses Enter
   │
   ├── MessageInput calls sendUserMessage(content)
   │
   ├── ChatApp creates userMsg = { id: "u-{ts}", role: "user", content, timestamp }
   │   └── addMessage(userMsg)                         ← immediate, optimistic
   │       └── useConversations updates state + localStorage
   │           └── MessageList re-renders with new message
   │
   ├── ChatApp calls sendMessage(content, activeConvId, onResponse)
   │   └── useAgentConnection sets sending=true
   │       └── MessageList shows typing indicator
   │
   ├── connector.sendMessage("what are my signals?", "conv-123", "abc-fingerprint")
   │   └── [1-2 seconds pass — connector calls backend]
   │
   ├── Connector returns { content: "TSLA is...", tools: ["get_artifacts"] }
   │
   ├── useAgentConnection creates assistantMsg = { id: "a-{ts}", role: "assistant", ... }
   │   └── onResponse(assistantMsg)
   │       └── addMessage(assistantMsg)
   │           └── useConversations updates state + localStorage
   │               └── MessageList re-renders with response
   │
   └── useAgentConnection sets sending=false
       └── Typing indicator disappears
```

## Responsive Behavior

| Viewport | Compact Mode | Expanded Mode |
|---|---|---|
| Mobile (< 640px) | `inset-x-4 bottom-4 h-[55vh]` — centered bottom sheet with 16px margins | `inset-4` — near-fullscreen with 16px margins |
| Tablet/Desktop (>= 640px) | `bottom-4 right-4 w-[400px] h-[520px]` — floating panel, bottom-right | `bottom-4 right-4 w-[680px] h-[700px]` — larger floating panel |

The bubble trigger is always `bottom-4 right-4` (or `left-4` if `position: "bottom-left"`).

## Keyboard Shortcuts

| Key | Action | Scope |
|---|---|---|
| `Escape` | Close chat window | Global (window.addEventListener) |
| `Enter` | Send message | When textarea is focused |
| `Shift+Enter` | New line in message | When textarea is focused |

## Extension Points

### Adding a New Connector

Create a new file implementing `AgentConnector`. No module changes needed.

### Adding Server-Side History

Implement `getConversations()` and `deleteConversation()` on your connector. Then upgrade `useConversations` to call them when available (merge with localStorage).

### Adding Streaming

Future: change `sendMessage` return type to `AsyncIterable<AgentResponseChunk>` or add a `onChunk` callback. The `useAgentConnection` hook would call `addMessage` incrementally. Components already handle `whitespace-pre-wrap` so partial content renders correctly.

### Adding File Attachments

Future: extend `Message` with `attachments?: { name, url, type }[]`. Extend `AgentConnector.sendMessage` to accept `files?: File[]`. Add an attachment button to `MessageInput`.

### Adding Markdown Rendering

Future: replace `<p className="whitespace-pre-wrap">{msg.content}</p>` in `MessageBubble` with a markdown renderer (e.g., `react-markdown`). Only `MessageBubble.tsx` changes.

## Isolation Guarantees

The module guarantees zero coupling to the host app:

| Concern | Module | Host |
|---|---|---|
| React components | All owned by module | None |
| State management | localStorage + React state | None |
| CSS | Scoped `--chat-*` vars | Provides optional `theme` overrides |
| API calls | Via `AgentConnector` interface | Implements the connector |
| Authentication | Receives `fingerprint` | Provides fingerprint (e.g., from Cognito) |
| npm dependencies | `react`, `clsx`, `lucide-react` | Already in any React project |
| Tailwind | Structural utilities only (`flex`, `rounded-xl`, `p-3`) | No custom config needed |

### What This Means for Extraction

When this module moves to its own repo:

1. Copy `chat-app/` → new repo
2. Add `react`, `clsx`, `lucide-react` as `peerDependencies`
3. Add a `tailwind.config.ts` with no custom extensions (structural utilities only)
4. Publish to npm or private registry
5. Host app: `npm install @myorg/chat-app` → `import { ChatApp } from "@myorg/chat-app"`
6. Zero code changes in the module
