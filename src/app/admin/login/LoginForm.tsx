"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="mt-8 grid gap-5">
      {state.error && (
        <p role="alert" className="border-l-2 border-danger bg-danger/5 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      <label className="block">
        <span className="label mb-1.5 block text-ink/65">Email</span>
        <input key={state.email ?? ""} name="email" type="email" required autoComplete="username" defaultValue={state.email} className="field" />
      </label>
      <label className="block">
        <span className="label mb-1.5 block text-ink/65">Password</span>
        <input name="password" type="password" required autoComplete="current-password" className="field" autoFocus={!!state.error} />
      </label>
      <button type="submit" disabled={pending} className="btn btn-ink mt-2 min-h-12 disabled:opacity-60">
        {pending ? "Signing in…" : "Sign in"} <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
