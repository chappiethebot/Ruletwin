"use client";
import { useActionState, useState } from "react";
import { signIn, signUp } from "@/lib/actions";
import { btnPrimary, input } from "./ui";

export function AuthForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [inState, inAction, inPending] = useActionState(signIn, undefined);
  const [upState, upAction, upPending] = useActionState(signUp, undefined);
  const state = mode === "in" ? inState : upState;
  const pending = mode === "in" ? inPending : upPending;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-[24px] font-semibold">{mode === "in" ? "Sign in" : "Create account"}</h1>
      <form action={mode === "in" ? inAction : upAction} className="flex flex-col gap-3">
        <input type="hidden" name="next" value={next} />
        <label className="text-[14px] font-medium">Email
          <input name="email" type="email" autoComplete="email" required className={`${input} mt-1`} />
        </label>
        <label className="text-[14px] font-medium">Password
          <input name="password" type="password" minLength={8} required autoComplete={mode === "in" ? "current-password" : "new-password"} className={`${input} mt-1`} />
        </label>
        {state?.error && <p role="alert" className="rounded-lg bg-crimson-soft p-3 text-[14px] text-crimson">{state.error}</p>}
        <button className={btnPrimary} disabled={pending}>{pending ? "Working…" : mode === "in" ? "Sign in" : "Create account"}</button>
      </form>
      <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="min-h-11 text-[14px] text-accent underline">
        {mode === "in" ? "No account? Create one" : "Have an account? Sign in"}
      </button>
    </div>
  );
}
