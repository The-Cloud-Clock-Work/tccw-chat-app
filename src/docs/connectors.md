# Creating Connectors

A connector is the bridge between the chat module and your AI backend. The module never knows what's behind the connector — it could be Bedrock, OpenAI, a local LLM, or a static JSON file.

## Built-in: HttpConnector (Recommended)

For most backends, you don't need to write a connector at all. Use the built-in `createHttpConnector`:

```tsx
import { ChatApp, createHttpConnector } from "./chat-app";

// Point at your API endpoint — that's it
<ChatApp config={{
  agentConnector: createHttpConnector("/api/chat"),
}} />
```

The factory POSTs `{ message, conversationId, fingerprint }` to your endpoint and expects `{ content, tools? }` back.

### With Auth Header

```tsx
<ChatApp config={{
  agentConnector: createHttpConnector("/api/chat", {
    headers: { Authorization: `Bearer ${token}` },
  }),
}} />
```

### With Custom Request/Response Transform

```tsx
<ChatApp config={{
  agentConnector: createHttpConnector("/api/chat", {
    // Reshape the body before sending
    transformRequest: ({ message, fingerprint }) => ({
      input: message,
      user_id: fingerprint,
      model: "claude-sonnet",
    }),
    // Reshape the response into AgentResponse
    transformResponse: (data: any) => ({
      content: data.output.text,
      tools: data.output.tools_used?.map((t: any) => t.name),
    }),
  }),
}} />
```

### What HttpConnector Sends

| Method | Path | Body / Params |
|---|---|---|
| `sendMessage` | `POST {endpoint}` | `{ message, conversationId, fingerprint }` |
| `getConversations` | `GET {endpoint}/conversations?fingerprint=...` | — |
| `deleteConversation` | `DELETE {endpoint}/conversations/{id}` | Header: `X-Fingerprint` |
| `onConnect` | `POST {endpoint}/connect` | `{ fingerprint }` |

All optional methods (`getConversations`, `deleteConversation`, `onConnect`) fail silently — if your backend doesn't implement those routes, nothing breaks.

### Error Handling

Non-2xx responses return `AgentResponse.error` with the status text. Network failures are caught and returned as error messages. The chat UI displays errors inline as assistant messages.

---

## Custom Connectors

If `createHttpConnector` doesn't fit (e.g., WebSocket, GraphQL, or SDK calls), implement the interface directly:

## The Interface

```typescript
interface AgentConnector {
  // REQUIRED — send a user message, get an AI response
  sendMessage(
    message: string,          // the user's text
    conversationId: string,   // module-generated UUID for the conversation
    fingerprint: string       // per-user identity token
  ): Promise<AgentResponse>;

  // OPTIONAL — load conversations from a remote store
  getConversations?(fingerprint: string): Promise<Conversation[]>;

  // OPTIONAL — delete a conversation from the remote store
  deleteConversation?(conversationId: string, fingerprint: string): Promise<void>;

  // OPTIONAL — called once on mount (pre-warm, validate fingerprint)
  onConnect?(fingerprint: string): Promise<void>;
}

interface AgentResponse {
  content: string;      // the AI's text response
  tools?: string[];     // tool names displayed as badges (e.g., ["get_signals", "list_orders"])
  error?: string;       // if set, displayed as an error message instead of content
}
```

## Minimal Connector (API Route)

The simplest real connector — POST to your own API:

```typescript
// my-connector.ts
import type { AgentConnector } from "./chat-app";

export const myConnector: AgentConnector = {
  async sendMessage(message, conversationId, fingerprint) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, conversationId, fingerprint }),
    });

    if (!res.ok) {
      return { content: "", error: `Server error: ${res.status}` };
    }

    return res.json(); // must return { content, tools? }
  },
};
```

```tsx
<ChatApp config={{ agentConnector: myConnector }} />
```

## AWS Bedrock Connector

For AgentCore Runtime agents:

```typescript
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";

export const bedrockConnector: AgentConnector = {
  async sendMessage(message, conversationId, fingerprint) {
    const res = await fetch("/api/chat/bedrock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, conversationId, fingerprint }),
    });
    return res.json();
  },

  async onConnect(fingerprint) {
    // Validate the user's agent session exists
    await fetch("/api/chat/session", {
      method: "POST",
      body: JSON.stringify({ fingerprint }),
    });
  },
};
```

The API route (server-side, has AWS credentials):

```typescript
// app/api/chat/bedrock/route.ts
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from "@aws-sdk/client-bedrock-agent-runtime";

const client = new BedrockAgentRuntimeClient({ region: "us-west-2" });

export async function POST(req: Request) {
  const { message, conversationId, fingerprint } = await req.json();

  const command = new InvokeAgentCommand({
    agentId: "YOUR_AGENT_ID",
    agentAliasId: "YOUR_ALIAS",
    sessionId: fingerprint,     // ← each user gets their own agent session
    inputText: message,
  });

  const response = await client.send(command);
  const chunks = [];
  for await (const event of response.completion ?? []) {
    if (event.chunk?.bytes) {
      chunks.push(new TextDecoder().decode(event.chunk.bytes));
    }
  }

  return Response.json({
    content: chunks.join(""),
    tools: response.toolsUsed?.map(t => t.name),
  });
}
```

## AgentCore Runtime Connector

For direct Runtime invocation (not via Bedrock Agents):

```typescript
export const agentCoreConnector: AgentConnector = {
  async sendMessage(message, conversationId, fingerprint) {
    const res = await fetch("/api/chat/agentcore", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, conversationId, fingerprint }),
    });
    return res.json();
  },
};
```

```typescript
// app/api/chat/agentcore/route.ts
import { BedrockAgentCoreClient, InvokeAgentRuntimeCommand } from "@aws-sdk/client-bedrock-agentcore";

const client = new BedrockAgentCoreClient({ region: "eu-west-1" });

export async function POST(req: Request) {
  const { message, conversationId, fingerprint } = await req.json();

  const response = await client.send(new InvokeAgentRuntimeCommand({
    runtimeIdentifier: "your-runtime-id",
    payload: JSON.stringify({
      prompt: message,
      session_id: `${fingerprint}:${conversationId}`,
    }),
  }));

  const body = JSON.parse(new TextDecoder().decode(response.body));
  return Response.json({
    content: body.result ?? body.message ?? "No response",
    tools: body.tools_used,
  });
}
```

## OpenAI / External API Connector

```typescript
export const openaiConnector: AgentConnector = {
  async sendMessage(message, conversationId, fingerprint) {
    const res = await fetch("/api/chat/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, fingerprint }),
    });
    return res.json();
  },
};
```

```typescript
// app/api/chat/openai/route.ts
export async function POST(req: Request) {
  const { message, fingerprint } = await req.json();

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [{ role: "user", content: message }],
      user: fingerprint,    // OpenAI tracks per-user usage
    }),
  });

  const data = await res.json();
  return Response.json({
    content: data.choices[0].message.content,
  });
}
```

## With Remote History (getConversations + deleteConversation)

When you implement the optional methods, the module can sync conversations with a server:

```typescript
export const fullConnector: AgentConnector = {
  async sendMessage(message, conversationId, fingerprint) {
    const res = await fetch("/api/chat/send", {
      method: "POST",
      body: JSON.stringify({ message, conversationId, fingerprint }),
    });
    return res.json();
  },

  async getConversations(fingerprint) {
    const res = await fetch(`/api/chat/conversations?fp=${fingerprint}`);
    return res.json(); // must return Conversation[]
  },

  async deleteConversation(conversationId, fingerprint) {
    await fetch(`/api/chat/conversations/${conversationId}`, {
      method: "DELETE",
      headers: { "X-Fingerprint": fingerprint },
    });
  },

  async onConnect(fingerprint) {
    // Create or validate user's agent session on the backend
    await fetch("/api/chat/connect", {
      method: "POST",
      body: JSON.stringify({ fingerprint }),
    });
  },
};
```

> **Note:** `getConversations` and `deleteConversation` are defined in the interface but not yet called by the module's `useConversations` hook (it uses localStorage). They exist for future server-sync implementations. When the hook is upgraded, it will call these methods if they exist on the connector.

## How Fingerprint Maps to Backend Data

The fingerprint is an opaque string. The backend decides what to do with it:

```
fingerprint: "google-oauth2|abc123"
                    │
                    ├── DynamoDB partition key:  PK = "abc123"
                    ├── S3 artifact prefix:      s3://artifacts/abc123/
                    ├── Agent session ID:        sessionId = "abc123"
                    ├── Memory namespace:        {actorId}/abc123/knowledge
                    └── Audit log tag:           tenant_id = "abc123"
```

Different products use different fingerprint sources:

| Product | Fingerprint Source | Backend Mapping |
|---|---|---|
| Pre-auth demo | `crypto.randomUUID()` (auto) | Ephemeral guest session |
| QITP (trading) | Cognito JWT `sub` | DynamoDB tenant partition |
| SaaS product | Auth0 `user_id` | Multi-tenant isolation |
| Internal tool | LDAP username | Corporate identity |

## Error Handling

The module handles errors at two levels:

**1. AgentResponse.error** — non-throwing, displayed inline:
```typescript
return { content: "", error: "Rate limit exceeded. Try again in 30 seconds." };
```

**2. Thrown exceptions** — caught by `useAgentConnection`, displayed as error message:
```typescript
async sendMessage(message, conversationId, fingerprint) {
  throw new Error("Network unreachable");
  // Module catches this and shows "Network unreachable" as an assistant message
}
```

Both render the same way — as an assistant message. The `error` field is preferred because it gives you control over the message text.

## Testing Connectors

```typescript
// Use MockAgentConnector for UI development
import { MockAgentConnector } from "./chat-app";

<ChatApp config={{ agentConnector: MockAgentConnector }} />
```

The mock adds 1-2 seconds of simulated latency and returns keyword-matched responses (signals, risk, pipeline, watchlist, help). It's a drop-in replacement for any real connector.

To test a real connector without a backend:

```typescript
const echoConnector: AgentConnector = {
  async sendMessage(message, conversationId, fingerprint) {
    return {
      content: `Echo: ${message}\n\nConversation: ${conversationId}\nFingerprint: ${fingerprint}`,
      tools: ["echo"],
    };
  },
};
```
