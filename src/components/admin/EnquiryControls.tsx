"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import clsx from "clsx";
import { addEnquiryNote, setEnquiryStatus } from "@/app/admin/actions/enquiries";
import { ENQUIRY_STATUSES } from "@/lib/validation";
import { Button, inputCls, useActionToast } from "./ui";

type Note = { id: string; body: string; author: string; at: string };

export function EnquiryControls({ id, status, notes }: { id: string; status: string; notes: Note[] }) {
  const router = useRouter();
  const done = useActionToast();
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");

  return (
    <div className="grid content-start gap-6">
      <section className="border border-ink/10 bg-white">
        <h2 className="display-wide border-b border-ink/10 px-5 py-3.5 text-xs">Status</h2>
        <div className="grid grid-cols-2 gap-2 p-5">
          {ENQUIRY_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              aria-pressed={s === status}
              onClick={() =>
                start(async () => {
                  if (done(await setEnquiryStatus(id, s))) router.refresh();
                })
              }
              className={clsx(
                "label min-h-11 border px-3 transition-colors",
                s === status ? "border-ink bg-ink text-paper" : "border-ink/20 bg-white hover:border-ink",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      <section className="border border-ink/10 bg-white">
        <h2 className="display-wide border-b border-ink/10 px-5 py-3.5 text-xs">Internal notes</h2>
        <div className="p-5">
          <label className="block">
            <span className="sr-only">New note</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className={inputCls} placeholder="Called, sent rates for 20 mm…" />
          </label>
          <Button
            className="mt-2"
            variant="ink"
            disabled={pending || !note.trim()}
            onClick={() =>
              start(async () => {
                if (done(await addEnquiryNote(id, note))) {
                  setNote("");
                  router.refresh();
                }
              })
            }
          >
            Add note
          </Button>
          <ul className="mt-5 divide-y divide-ink/10">
            {notes.length === 0 && <li className="py-2 text-sm text-ink/65">No notes yet. Notes are visible to administrators only.</li>}
            {notes.map((n) => (
              <li key={n.id} className="py-3">
                <p className="whitespace-pre-wrap text-sm">{n.body}</p>
                <p className="mt-1 text-xs text-ink/65">
                  {n.author} · {n.at}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
