"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/auth";
import { adminAction } from "@/lib/admin-action";
import { ENQUIRY_STATUSES } from "@/lib/validation";

export async function setEnquiryStatus(id: string, status: string) {
  return adminAction(
    async (admin) => {
      const s = z.enum(ENQUIRY_STATUSES).parse(status);
      const e = await db.enquiry.update({ where: { id }, data: { status: s } });
      await logActivity(admin.email, "status", "enquiry", `${e.reference} → ${s}`, id);
    },
    { revalidate: false, message: "Status updated." },
  );
}

export async function addEnquiryNote(id: string, body: string) {
  return adminAction(
    async (admin) => {
      const text = z.string().trim().min(1, "Write a note first.").max(4000).parse(body);
      await db.enquiryNote.create({ data: { enquiryId: id, body: text, authorId: admin.sub } });
      await logActivity(admin.email, "note", "enquiry", `Added a note`, id);
    },
    { revalidate: false, message: "Note added." },
  );
}
