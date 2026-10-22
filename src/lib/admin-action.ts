import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin, UnauthorizedError } from "./auth";

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };

/**
 * Wraps every privileged mutation: re-verifies the session server-side,
 * converts validation errors to messages, and refreshes the public site.
 */
export async function adminAction<T>(
  fn: (admin: { email: string; sub: string }) => Promise<T>,
  opts: { revalidate?: boolean; message?: string } = {},
): Promise<ActionResult<T>> {
  try {
    const admin = await requireAdmin();
    const data = await fn(admin);
    if (opts.revalidate !== false) revalidatePath("/", "layout");
    return { ok: true, data, message: opts.message };
  } catch (e) {
    if (e instanceof UnauthorizedError) return { ok: false, error: "Your session has expired. Please sign in again." };
    if (e instanceof z.ZodError) return { ok: false, error: e.issues.map((i) => `${i.path.join(".") || "Value"}: ${i.message}`).join("; ") };
    if (e instanceof AdminError) return { ok: false, error: e.message };
    console.error("Admin action failed", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

export class AdminError extends Error {}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
