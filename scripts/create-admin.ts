/* Create or reset an administrator account. There is deliberately no public
 * registration route — admins are provisioned from the server only.
 *
 *   npm run admin:create -- --email you@example.com --name "Your Name"
 *
 * The password is read from the ADMIN_PASSWORD environment variable or an
 * interactive prompt; it is never accepted as a CLI argument (shell history). */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "readline";

const db = new PrismaClient();

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function prompt(q: string) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise<string>((res) => rl.question(q, (a) => (rl.close(), res(a))));
}

async function main() {
  const email = (arg("email") ?? process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const name = (arg("name") ?? process.env.ADMIN_NAME ?? "Administrator").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Provide a valid --email.");

  const password = process.env.ADMIN_PASSWORD ?? (await prompt("Password (min 12 chars): "));
  if (password.length < 12) throw new Error("Password must be at least 12 characters.");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.adminUser.upsert({
    where: { email },
    create: { email, name, passwordHash },
    update: { passwordHash, name },
  });
  console.log(`Admin ready: ${user.email}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
