# Theming

The chat module ships its own dark glassmorphism theme. Every color is a CSS custom property scoped to `--chat-*`, injected via `ChatThemeProvider`. The host app's CSS is never touched.

## Default Theme

```typescript
const defaultTheme: ChatTheme = {
  brandColor:          "#4f46e5",                    // indigo-600 — bubble, send button, user messages
  brandColorHover:     "#4338ca",                    // indigo-700 — button hover states
  brandColorSubtle:    "rgba(79, 70, 229, 0.15)",    // assistant avatar background
  brandColorText:      "#818cf8",                    // indigo-400 — icons, links, active states

  colorBackground:     "#0a0a1a",                    // deepest background
  colorSurface:        "#1e1e2e",                    // panel background
  colorSurfaceCard:    "#2a2a3e",                    // card/input backgrounds
  colorBorder:         "#3f3f5e",                    // standard borders
  colorForeground:     "#e2e8f0",                    // primary text (slate-200)
  colorMuted:          "#94a3b8",                    // secondary text (slate-400)

  glassBg:             "rgba(30, 30, 46, 0.55)",     // translucent glass panel
  glassBorder:         "rgba(255, 255, 255, 0.07)",  // subtle glass edge
  glassBorderHighlight:"rgba(255, 255, 255, 0.12)",  // prominent glass edge
  glassShadowStrong:   "0 12px 48px rgba(0,0,0,0.35), inset 0 0.5px 0 rgba(255,255,255,0.08)",
};
```

## Overriding Colors

Pass a partial `theme` object — only the tokens you want to change:

```tsx
// Red brand instead of indigo
<ChatApp config={{
  agentConnector: myConnector,
  theme: {
    brandColor: "#e11d48",           // rose-600
    brandColorHover: "#be123c",      // rose-700
    brandColorSubtle: "rgba(225, 29, 72, 0.15)",
    brandColorText: "#fb7185",       // rose-400
  },
}} />
```

```tsx
// Light mode
<ChatApp config={{
  agentConnector: myConnector,
  theme: {
    colorBackground: "#ffffff",
    colorSurface: "#f8fafc",
    colorSurfaceCard: "#f1f5f9",
    colorBorder: "#e2e8f0",
    colorForeground: "#0f172a",
    colorMuted: "#64748b",
    glassBg: "rgba(248, 250, 252, 0.8)",
    glassBorder: "rgba(0, 0, 0, 0.06)",
    glassBorderHighlight: "rgba(0, 0, 0, 0.1)",
    glassShadowStrong: "0 12px 48px rgba(0,0,0,0.08)",
  },
}} />
```

```tsx
// Green fintech
<ChatApp config={{
  agentConnector: myConnector,
  theme: {
    brandColor: "#059669",
    brandColorHover: "#047857",
    brandColorSubtle: "rgba(5, 150, 105, 0.15)",
    brandColorText: "#34d399",
  },
}} />
```

## How It Works Internally

`ChatThemeProvider` wraps the module root with a `<div style={cssVars}>` that uses `display: contents` (invisible in layout). All 14 tokens become CSS custom properties:

```html
<div style="
  --chat-brand: #4f46e5;
  --chat-brand-hover: #4338ca;
  --chat-brand-subtle: rgba(79, 70, 229, 0.15);
  --chat-brand-text: #818cf8;
  --chat-bg: #0a0a1a;
  --chat-surface: #1e1e2e;
  --chat-surface-card: #2a2a3e;
  --chat-border: #3f3f5e;
  --chat-fg: #e2e8f0;
  --chat-muted: #94a3b8;
  --chat-glass-bg: rgba(30, 30, 46, 0.55);
  --chat-glass-border: rgba(255, 255, 255, 0.07);
  --chat-glass-border-hi: rgba(255, 255, 255, 0.12);
  --chat-glass-shadow: 0 12px 48px ...;
  display: contents;
">
  <!-- all chat components inherit these vars -->
</div>
```

Components reference them via inline styles:

```tsx
style={{ backgroundColor: "var(--chat-brand)" }}
style={{ color: "var(--chat-fg)" }}
style={{ borderColor: "var(--chat-glass-border)" }}
```

## CSS Variable Reference

| Variable | Used For | Where |
|---|---|---|
| `--chat-brand` | Bubble bg, send button bg, user message bg | ChatBubble, MessageInput, MessageBubble |
| `--chat-brand-hover` | Button hover states | MessageInput |
| `--chat-brand-subtle` | Assistant avatar bg | MessageBubble, MessageList |
| `--chat-brand-text` | Icon colors, active indicators | MessageBubble, MessageList |
| `--chat-bg` | Not directly used (available for extensions) | — |
| `--chat-surface` | Chat window bg (with 92% opacity via color-mix) | ChatWindow |
| `--chat-surface-card` | User avatar bg | MessageBubble |
| `--chat-border` | Not directly used (available for extensions) | — |
| `--chat-fg` | Primary text color | ChatWindow, MessageInput, ChatHeader |
| `--chat-muted` | Secondary text, timestamps, placeholders | MessageBubble, ChatHeader, ConversationList |
| `--chat-glass-bg` | Assistant message bg, typing indicator bg | MessageBubble, MessageList |
| `--chat-glass-border` | Message borders, input borders, dividers | MessageBubble, MessageInput, ChatHeader |
| `--chat-glass-border-hi` | Chat window outer border | ChatWindow |
| `--chat-glass-shadow` | Chat window shadow | ChatWindow |

## Overriding via Host CSS (Alternative)

Instead of the `theme` prop, you can override variables in your host app's CSS. The `--chat-*` variables cascade from the provider div, but you can set them higher in the DOM:

```css
/* In your host app's globals.css */
:root {
  --chat-brand: #e11d48;
  --chat-brand-hover: #be123c;
}
```

This works because CSS custom properties cascade. The host-level declaration will be overridden by the `ChatThemeProvider` inline styles (inline styles have higher specificity). To win over inline styles, use `!important`:

```css
:root {
  --chat-brand: #e11d48 !important;
}
```

**Recommendation:** Use the `theme` prop for simplicity. Use CSS overrides only if you need runtime theme switching (e.g., a dark/light toggle that affects the chat).

## Non-Themed Elements

Two visual elements are **not** controlled by the theme system:

1. **"online" badge** — hardcoded `bg-green-500/20 text-green-400` (Tailwind utility classes). This is intentional — the status indicator should always be green/red regardless of brand color.

2. **Delete button hover** — hardcoded `hover:text-red-400 hover:bg-red-500/10`. Destructive actions always use red, independent of brand.

These use Tailwind utility classes, not CSS variables. To change them, modify the component files directly.
