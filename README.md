# Chat App Module

Self-contained, portable AI chat component. Zero external dependencies beyond `react`, `clsx`, and `lucide-react`.

## Quick Start

```tsx
import { ChatApp, createHttpConnector } from "./chat-app";

// Point at your backend — one line
<ChatApp config={{
  agentConnector: createHttpConnector("/api/chat"),
  logo: "/my-logo.png",
  title: "My Assistant",
}} />
```

Or use the mock for development without a backend:

```tsx
import { ChatApp, MockAgentConnector } from "./chat-app";

<ChatApp config={{
  agentConnector: MockAgentConnector,
  logo: "/my-logo.png",
  title: "My Assistant",
}} />
```

One import, one component, one config object.

## How It Works

```
<ChatApp config={...}>
  └── ChatThemeProvider          → scoped --chat-* CSS variables
        └── ChatContext          → hooks: fingerprint, conversations, agent connection
              ├── ChatBubble     → floating trigger button (bottom-right or bottom-left)
              └── ChatWindow     → the chat panel
                    ├── ChatHeader        → logo, title, status, controls
                    ├── MessageList       → scrollable messages + typing indicator
                    │   └── MessageBubble → single message (user or assistant)
                    ├── ConversationList  → history sidebar
                    └── MessageInput      → textarea + send button
```

### Per-User Fingerprint

Every user gets a unique fingerprint that identifies their agent session:

1. `config.fingerprint` → use directly (e.g., Cognito JWT `sub`)
2. `localStorage["chat-app:fingerprint"]` → use stored UUID
3. `crypto.randomUUID()` → generate, store, use

The fingerprint flows through every `sendMessage()` call. The backend uses it as the agent session ID, DynamoDB partition key, or S3 prefix — whatever makes sense for the product.

Conversations persist to `localStorage` keyed by fingerprint: `chat-app:conversations:{fingerprint}`. Different users on the same browser get separate history.

## Configuration

```tsx
interface ChatAppConfig {
  // REQUIRED — how the module talks to the AI backend
  agentConnector: AgentConnector;

  // Branding
  logo?: string | ReactNode;   // URL string, React element, or omit for default Bot icon
  title?: string;              // Header text (default: none)
  placeholder?: string;        // Input placeholder (default: "Message...")
  welcomeMessage?: string;     // First message in new conversations

  // Per-user identity
  fingerprint?: string;        // Override auto-generated UUID (e.g., Cognito sub)

  // Theme
  theme?: Partial<ChatTheme>;  // Override any of the 14 color tokens

  // Layout
  position?: "bottom-right" | "bottom-left";  // Bubble position (default: bottom-right)
  zIndex?: number;                             // Stacking order (default: 30)
}
```

## Creating Connectors

See [docs/connectors.md](docs/connectors.md) for the full guide.

## Customizing the Theme

See [docs/theming.md](docs/theming.md) for the full guide.

## Architecture

See [docs/architecture.md](docs/architecture.md) for the component hierarchy, data flow, and extension points.

## File Structure

```
chat-app/
├── index.ts                          # Public exports
├── ChatApp.tsx                       # Root component
├── ChatContext.ts                    # Internal React context
├── types/
│   ├── index.ts                      # Re-exports
│   ├── message.ts                    # Message, Conversation
│   ├── connector.ts                  # AgentConnector, AgentResponse
│   └── config.ts                     # ChatAppConfig, ChatTheme
├── connector/
│   ├── HttpConnector.ts              # Generic HTTP connector factory (createHttpConnector)
│   └── MockAgentConnector.ts         # Simulated responses for demo mode
├── hooks/
│   ├── useFingerprint.ts             # Per-user identity
│   ├── useConversations.ts           # CRUD + localStorage persistence
│   └── useAgentConnection.ts         # Wraps connector.sendMessage()
├── components/
│   ├── ChatBubble.tsx                # Floating trigger button
│   ├── ChatWindow.tsx                # Panel frame + sizing
│   ├── ChatHeader.tsx                # Title bar + controls
│   ├── MessageList.tsx               # Message feed + typing indicator
│   ├── MessageBubble.tsx             # Single message row
│   ├── MessageInput.tsx              # Text input + send
│   └── ConversationList.tsx          # History sidebar
├── theme/
│   ├── defaults.ts                   # Default color tokens
│   └── ChatThemeProvider.tsx         # Scoped CSS variable injection
└── docs/
    ├── architecture.md               # Component hierarchy + data flow
    ├── connectors.md                 # How to create connectors
    └── theming.md                    # How to customize colors
```

## What the Module Exports

```typescript
// Components
export { ChatApp } from "./ChatApp";

// Connectors
export { MockAgentConnector } from "./connector/MockAgentConnector";
export { createHttpConnector } from "./connector/HttpConnector";

// Types (for host app to implement)
export type { ChatAppConfig, ChatTheme } from "./types";
export type { AgentConnector, AgentResponse } from "./types";
export type { HttpConnectorOptions } from "./connector/HttpConnector";
export type { Message, Conversation } from "./types";
```

## Rules

- **Never import host app code** — no `@/components/`, `@/lib/`, `@/hooks/`
- **Never use global CSS vars** — only `--chat-*` from ChatThemeProvider
- **Never hardcode branding** — logo, title, colors come from config
- **All state is self-contained** — localStorage keyed by fingerprint
