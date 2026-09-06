import { cookies } from "next/headers";
import type { SessionPayload } from "@/types/auth";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/jwt";

// Password hashing, session creation, and destruction now live entirely in the .NET backend
// (Auth/PasswordHasher.cs, Controllers/AuthController.cs) — this file only reads/verifies the
// cookie for Next.js pages that need to know "is someone logged in" (e.g. the landing page).
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export { SESSION_COOKIE };
