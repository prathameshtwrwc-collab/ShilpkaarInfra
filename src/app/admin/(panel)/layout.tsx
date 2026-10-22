import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminNav } from "@/components/admin/AdminNav";
import { ToastProvider } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();
  const newCount = await db.enquiry.count({ where: { status: "NEW" } });
  return (
    <ToastProvider>
      <div className="min-h-screen bg-paper-2 text-ink lg:grid lg:grid-cols-[15rem_1fr]">
        <AdminNav name={admin.name} email={admin.email} newCount={newCount} />
        <main id="main" className="min-w-0 px-4 py-6 sm:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
