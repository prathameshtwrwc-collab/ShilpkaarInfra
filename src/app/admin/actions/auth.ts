"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, destroySession, logActivity } from "@/lib/auth";
import { clientIp, hashIp, rateLimit } from "@/lib/rate-limit";

export type LoginState = { error?: string; email?: string };

// Compared against when the email is unknown, so response time doesn't
// reveal which accounts exist.
const DUMMY_HASH = "$2b$12$e7dNTFD/8ZqFJi55cXYiaOlewNMWCNTybm66baDEcOpL5ReWCGuKu";

const schema = z.object({ email: z.email().max(160), password: z.string().min(1).max(200) });

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 160);
  const ipHash = hashIp(await clientIp());
  if (!(await rateLimit("login", ipHash, 8, 15 * 60))) {
    return { error: "Too many sign-in attempts. Please wait 15 minutes and try again.", email };
  }
  const parsed = schema.safeParse({ email, password: formData.get("password") });
  if (!parsed.success) return { error: "Enter your email and password.", email };

  const user = await db.adminUser.findUnique({ where: { email: parsed.data.email } });
  const ok = await bcrypt.compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return { error: "Incorrect email or password.", email };

  await db.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user);
  await logActivity(user.email, "login", "session", "Signed in");
  redirect("/admin");
}

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}
