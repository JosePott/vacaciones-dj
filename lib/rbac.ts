import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE, verifySessionToken, type SessionPayload, type UserRole } from "./session";

const DEFAULT_REDIRECT = "/";

/**
 * Garantiza que haya sesiÃ³n activa; si falta, redirige de forma segura.
 */
export async function requireSession(options?: { redirectTo?: string }): Promise<SessionPayload> {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) {
    redirect(options?.redirectTo ?? DEFAULT_REDIRECT);
  }
  return session;
}

/**
 * Fuerza el rol esperado (\"HR\" | \"EMPLOYEE\"); reusa requireSession para evitar duplicar lÃ³gica.
 */
export async function requireRole(
  role: UserRole,
  options?: { redirectTo?: string },
): Promise<SessionPayload> {
  const session = await requireSession({ redirectTo: options?.redirectTo });
  if (session.role !== role) {
    redirect(options?.redirectTo ?? DEFAULT_REDIRECT);
  }
  return session;
}
