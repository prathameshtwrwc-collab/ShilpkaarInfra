import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { Mark } from "@/components/site/Header";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Sales Pipeline Login", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  return (
    <main className="grid min-h-screen bg-ink text-paper lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <div className="tech-grid absolute inset-0 opacity-50" />
        <div className="absolute bottom-12 left-12 right-12">
          <p className="display text-[7rem] leading-[0.82] text-paper/90">
            Sales
            <br />
            pipeline.
          </p>
          <p className="label mt-6 text-paper/50">Enquiries · Catalogue · Fleet · Content</p>
        </div>
      </div>
      <div className="flex flex-col justify-center bg-paper px-6 py-16 text-ink sm:px-16">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="inline-flex items-center gap-3">
            <Mark className="h-8 w-8" />
            <span className="display-wide text-sm tracking-[0.18em]">Shilpkar</span>
          </Link>
          <h1 className="display mt-10 text-6xl">Sign in</h1>
          <p className="mt-3 text-sm text-ink/65">Authorised administrators only. Accounts are created by the site owner on the server.</p>
          <LoginForm />
          <Link href="/" className="label mt-10 inline-block text-ink/65 hover:text-ink">
            ← Back to website
          </Link>
        </div>
      </div>
    </main>
  );
}
