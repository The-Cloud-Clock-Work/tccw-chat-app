import type { AgentConnector, AgentResponse, Conversation } from "../types";

export interface HttpConnectorOptions {
  headers?: Record<string, string>;
  transformRequest?: (body: {
    message: string;
    conversationId: string;
    fingerprint: string;
  }) => unknown;
  transformResponse?: (data: unknown) => AgentResponse;
}

export function createHttpConnector(
  endpoint: string,
  options?: HttpConnectorOptions
): AgentConnector {
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...options?.headers,
  };

  async function request(
    path: string,
    init: RequestInit
  ): Promise<Response> {
    const res = await fetch(`${endpoint}${path}`, {
      ...init,
      headers: { ...baseHeaders, ...((init.headers as Record<string, string>) ?? {}) },
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    return res;
  }

  return {
    async sendMessage(
      message: string,
      conversationId: string,
      fingerprint: string
    ): Promise<AgentResponse> {
      const body = { message, conversationId, fingerprint };
      const payload = options?.transformRequest
        ? options.transformRequest(body)
        : body;

      try {
        const res = await request("", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        return options?.transformResponse
          ? options.transformResponse(data)
          : (data as AgentResponse);
      } catch (e) {
        return {
          content: "",
          error: e instanceof Error ? e.message : "Request failed",
        };
      }
    },

    async getConversations(fingerprint: string): Promise<Conversation[]> {
      try {
        const res = await request(
          `/conversations?fingerprint=${encodeURIComponent(fingerprint)}`,
          { method: "GET" }
        );
        return res.json();
      } catch {
        return [];
      }
    },

    async deleteConversation(
      conversationId: string,
      fingerprint: string
    ): Promise<void> {
      try {
        await request(`/conversations/${encodeURIComponent(conversationId)}`, {
          method: "DELETE",
          headers: { "X-Fingerprint": fingerprint },
        });
      } catch {
        // silent — localStorage is the fallback
      }
    },

    async onConnect(fingerprint: string): Promise<void> {
      try {
        await request("/connect", {
          method: "POST",
          body: JSON.stringify({ fingerprint }),
        });
      } catch {
        // silent — connection warmup is best-effort
      }
    },
  };
}
