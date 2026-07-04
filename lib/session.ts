const SESSION_COOKIE_NAME = "vac_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type UserRole = "HR" | "EMPLOYEE";

export type SessionPayload = {
  userId: string;
  role: UserRole;
  exp: number; // timestamp en ms
};

const encoder = new TextEncoder();

const sessionSecret =
  process.env.SESSION_SECRET?.trim() || "dev-session-secret-change-me";

function toBase64Url(input: string): string {
  const base64 = btoa(input);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(base64Url: string): string {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return atob(padded);
}

function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function hmacSha256(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return bufferToHex(signature);
}

function buildPayload(data: { userId: string; role: UserRole }): SessionPayload {
  return {
    userId: data.userId,
    role: data.role,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
}

async function signPayload(payload: SessionPayload): Promise<string> {
  const body = toBase64Url(JSON.stringify(payload));
  const signature = await hmacSha256(body, sessionSecret);
  return `${body}.${signature}`;
}

export async function verifySessionToken(
  token?: string | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = await hmacSha256(body, sessionSecret);
  if (!safeEqual(expected, signature)) return null;

  try {
    const payload = JSON.parse(fromBase64Url(body)) as SessionPayload;
    if (!payload.userId || !payload.role || typeof payload.exp !== "number") return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSessionToken(data: {
  userId: string;
  role: UserRole;
}): Promise<string> {
  const payload = buildPayload(data);
  return signPayload(payload);
}

export async function createSessionCookie(data: {
  userId: string;
  role: UserRole;
}): Promise<{
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    sameSite: "lax";
    secure: boolean;
    path: string;
    maxAge: number;
  };
}> {
  const token = await createSessionToken(data);
  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    },
  };
}

export function destroySessionCookie(): {
  name: string;
  value: string;
  options: { httpOnly: boolean; sameSite: "lax"; secure: boolean; path: string; maxAge: number };
} {
  return {
    name: SESSION_COOKIE_NAME,
    value: "",
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    },
  };
}

export const SESSION_COOKIE = SESSION_COOKIE_NAME;
export const SESSION_TTL_SECONDS = SESSION_MAX_AGE_SECONDS;
