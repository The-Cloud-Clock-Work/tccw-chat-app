import type { ReactNode, CSSProperties } from "react";
import type { ChatTheme } from "../types";
import { defaultTheme } from "./defaults";

interface Props {
  theme?: Partial<ChatTheme>;
  children: ReactNode;
}

export function ChatThemeProvider({ theme, children }: Props) {
  const t = { ...defaultTheme, ...theme };

  const cssVars: CSSProperties & Record<string, string> = {
    "--chat-brand": t.brandColor,
    "--chat-brand-hover": t.brandColorHover,
    "--chat-brand-subtle": t.brandColorSubtle,
    "--chat-brand-text": t.brandColorText,
    "--chat-bg": t.colorBackground,
    "--chat-surface": t.colorSurface,
    "--chat-surface-card": t.colorSurfaceCard,
    "--chat-border": t.colorBorder,
    "--chat-fg": t.colorForeground,
    "--chat-muted": t.colorMuted,
    "--chat-glass-bg": t.glassBg,
    "--chat-glass-border": t.glassBorder,
    "--chat-glass-border-hi": t.glassBorderHighlight,
    "--chat-glass-shadow": t.glassShadowStrong,
  };

  return <div style={{ ...cssVars, display: "contents" }}>{children}</div>;
}
