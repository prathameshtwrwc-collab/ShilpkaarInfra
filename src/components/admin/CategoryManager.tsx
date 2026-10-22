"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { deleteCategory, saveCategory } from "@/app/admin/actions/catalogue";
import { Button, Card, inputCls, useActionToast } from "./ui";

export function CategoryManager({ categories }: { categories: { id: string; name: string; count: number }[] }) {
  const [names, setNames] = useState<Record<string, string>>(Object.fromEntries(categories.map((c) => [c.id, c.name])));
  useEffect(() => setNames(Object.fromEntries(categories.map((c) => [c.id, c.name]))), [categories]);
  const [newName, setNewName] = useState("");
  const [pending, start] = useTransition();
  const done = useActionToast();
  const router = useRouter();
  const run = (fn: () => Promise<Parameters<typeof done>[0]>, ok: string) =>
    start(async () => {
      if (done(await fn(), ok)) router.refresh();
    });

  return (
    <Card title="Categories">
      <p className="mb-4 text-xs text-ink/65">These become the filters on the public catalogue. Empty categories are hidden automatically.</p>
      <ul className="grid gap-2">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center gap-2">
            <label className="flex-1">
              <span className="sr-only">Category name</span>
              <input className={inputCls} value={names[c.id] ?? ""} onChange={(e) => setNames((n) => ({ ...n, [c.id]: e.target.value }))} />
            </label>
            <span className="w-6 text-right font-mono text-xs text-ink/65">{c.count}</span>
            <Button variant="ghost" className="px-2" disabled={pending || names[c.id] === c.name} onClick={() => run(() => saveCategory({ id: c.id, name: names[c.id] }), "Category renamed.")}>
              Save
            </Button>
            <Button
              variant="ghost"
              className="px-2 text-danger"
              disabled={pending || c.count > 0}
              title={c.count ? "Category has products" : "Delete"}
              aria-label={`Delete ${c.name}`}
              onClick={() => confirm(`Delete category “${c.name}”?`) && run(() => deleteCategory(c.id), "Category deleted.")}
            >
              ✕
            </Button>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex gap-2 border-t border-ink/10 pt-4">
        <label className="flex-1">
          <span className="sr-only">New category</span>
          <input className={inputCls} placeholder="New category" value={newName} onChange={(e) => setNewName(e.target.value)} />
        </label>
        <Button
          variant="ink"
          disabled={pending || newName.trim().length < 2}
          onClick={() =>
            run(async () => {
              const r = await saveCategory({ name: newName });
              if (r.ok) setNewName("");
              return r;
            }, "Category added.")
          }
        >
          Add
        </Button>
      </div>
    </Card>
  );
}
