// src/lib/sebHashes.ts
import api from "@/lib/api";

declare global {
  interface Window {
    SafeExamBrowser?: {
      security?: {
        updateKeys?: (cb: () => void) => void;
        browserExamKey?: string; // BEK (64-hex)
        configKey?: string;      // CK  (64-hex)
      };
    };
    // Vite-style env flag to allow sending raw keys if you want
    // set VITE_SEB_SEND_RAW_KEYS=1 at build time to enable
    import_meta?: any;
  }
}

const SEND_RAW_KEYS =
  (import.meta as any)?.env?.VITE_SEB_SEND_RAW_KEYS === "1" ||
  (typeof process !== "undefined" &&
    (process as any)?.env?.VITE_SEB_SEND_RAW_KEYS === "1");

async function sha256Hex(s: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(s));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function absoluteApiUrl(pathOrUrl: string): string {
  try {
    return new URL(pathOrUrl).href; // already absolute
  } catch {
    const base = (api as any)?.defaults?.baseURL || window.location.origin;
    return new URL(pathOrUrl, base).href;
  }
}

export function getRawSebKeys() {
  const sec = window.SafeExamBrowser?.security;
  return {
    bek: sec?.browserExamKey || null,
    ck: sec?.configKey || null,
  };
}

export async function computeRequestHash(pathOrUrl: string): Promise<string | null> {
  const { bek } = getRawSebKeys();
  if (!bek) return null;
  const abs = absoluteApiUrl(pathOrUrl);
  return sha256Hex(abs + String(bek));
}

export async function computeConfigKeyHash(pathOrUrl: string): Promise<string | null> {
  const { ck } = getRawSebKeys();
  if (!ck) return null;
  const abs = absoluteApiUrl(pathOrUrl);
  return sha256Hex(abs + String(ck));
}

/**
 * Build headers for your SEB-protected endpoints.
 * - Always includes RequestHash / ConfigKeyHash if available
 * - Optionally includes raw BEK/CK when VITE_SEB_SEND_RAW_KEYS=1
 */
export async function sebHeaders(pathOrUrl: string): Promise<Record<string, string>> {
  // Some SEB builds expose updateKeys(); harmless no-op otherwise
  if (window.SafeExamBrowser?.security?.updateKeys) {
    await new Promise<void>(res =>
      window.SafeExamBrowser!.security!.updateKeys!(res)
    );
  }

  const headers: Record<string, string> = {};

  const [reqHash, cfgHash] = await Promise.all([
    computeRequestHash(pathOrUrl),
    computeConfigKeyHash(pathOrUrl),
  ]);

  if (cfgHash) headers["X-SafeExamBrowser-ConfigKeyHash"] = cfgHash;
  if (reqHash) headers["X-SafeExamBrowser-RequestHash"] = reqHash;

  if (SEND_RAW_KEYS) {
    const { bek, ck } = getRawSebKeys();
    if (bek) headers["X-SafeExamBrowser-BrowserExamKey"] = bek; // raw BEK
    if (ck) headers["X-SafeExamBrowser-ConfigKey"] = ck;        // raw CK
  }

  return headers;
}
