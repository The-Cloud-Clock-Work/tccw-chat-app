import { useState } from "react";

const STORAGE_KEY = "chat-app:fingerprint";

export function useFingerprint(override?: string): string {
  const [fingerprint] = useState<string>(() => {
    if (override) return override;
    if (typeof window === "undefined") return "ssr-placeholder";
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    const fresh = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, fresh);
    return fresh;
  });
  return fingerprint;
}
