import type { AgentConnector, AgentResponse } from "../types";

function getSimulatedResponse(input: string): AgentResponse {
  const q = input.toLowerCase();

  if (q.includes("help") || q.includes("what can"))
    return {
      content:
        "I can help with a variety of tasks:\n\n\u2022 Answer questions about your data\n\u2022 Explain concepts and documentation\n\u2022 Run searches and lookups\n\u2022 Summarize information\n\nJust ask!",
    };

  if (q.includes("hello") || q.includes("hi") || q.includes("hey"))
    return {
      content: "Hello! I'm your AI assistant. How can I help you today?",
    };

  if (q.includes("status") || q.includes("health"))
    return {
      content:
        "All systems are running normally. This is a demo response — connect a real agent backend via `createHttpConnector(endpoint)` for live data.",
      tools: ["get_status"],
    };

  if (q.includes("search") || q.includes("find"))
    return {
      content:
        "In demo mode, I simulate tool calls. With a real connector, I would search your data and return results.",
      tools: ["search"],
    };

  return {
    content:
      "I understand your question. This is a demo response — connect a real agent backend for live answers. Try asking for help, status, or search.",
  };
}

export const MockAgentConnector: AgentConnector = {
  async sendMessage(message: string, _conversationId: string, _fingerprint: string) {
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 800));
    return getSimulatedResponse(message);
  },
};
