import type { ReactNode } from "react";
import type { AgentConnector } from "./connector";

export interface ChatTheme {
  brandColor: string;
  brandColorHover: string;
  brandColorSubtle: string;
  brandColorText: string;
  colorBackground: string;
  colorSurface: string;
  colorSurfaceCard: string;
  colorBorder: string;
  colorForeground: string;
  colorMuted: string;
  glassBg: string;
  glassBorder: string;
  glassBorderHighlight: string;
  glassShadowStrong: string;
}

export interface ChatAppConfig {
  agentConnector: AgentConnector;
  logo?: string | ReactNode;
  title?: string;
  placeholder?: string;
  welcomeMessage?: string;
  fingerprint?: string;
  theme?: Partial<ChatTheme>;
  position?: "bottom-right" | "bottom-left";
  zIndex?: number;
}
