import type { Conversation } from "./message";

export interface AgentResponse {
  content: string;
  tools?: string[];
  error?: string;
}

export interface AgentConnector {
  sendMessage(
    message: string,
    conversationId: string,
    fingerprint: string
  ): Promise<AgentResponse>;

  getConversations?(fingerprint: string): Promise<Conversation[]>;
  deleteConversation?(conversationId: string, fingerprint: string): Promise<void>;
  onConnect?(fingerprint: string): Promise<void>;
}
