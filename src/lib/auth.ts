import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession, verifySession, type SessionPayload } from "./session";

export async function createSession(user: { id: string; email: string; name: string }) {
  const token = await signSession({ sub: user.id, email: user.email, name: user.name });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Returns the session only if the token is valid AND the admin still exists. */
export async function getAdmin(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const session = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await db.adminUser.findUnique({ where: { id: session.sub }, select: { id: true } });
  return user ? session : null;
}

/** For pages: redirect to login when unauthenticated. */
export async function requireAdminPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

/** For server actions / route handlers: throw when unauthenticated. */
export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) throw new UnauthorizedError();
  return admin;
}

export async function logActivity(actor: string, action: string, entity: string, summary: string, entityId?: string) {
  await db.activityLog.create({ data: { actor, action, entity, summary, entityId } });
}
