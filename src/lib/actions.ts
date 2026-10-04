"use server";
// Every mutation authenticates and authorizes on the server, even when the page is protected.
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import * as db from "./db.ts";
import { HOSTED_DEMO, currentUser, endSession, getDb, safeNext, startSession } from "./auth.ts";
import { getSnapshot, isDate, resolveFor } from "./data.ts";

export type FormState = { error?: string; ok?: string } | undefined;

const HOSTED_MSG = "Accounts are disabled in this hosted read-only demo. Run RuleTwin locally to save properties and reports.";

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  if (HOSTED_DEMO) return { error: HOSTED_MSG };
  const id = db.verifyUser(getDb(), String(form.get("email") ?? ""), String(form.get("password") ?? ""));
  if (!id) return { error: "Email or password is incorrect." };
  await startSession(id);
  redirect(safeNext(form.get("next")));
}

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  if (HOSTED_DEMO) return { error: HOSTED_MSG };
  const r = db.createUser(getDb(), String(form.get("email") ?? ""), String(form.get("password") ?? ""));
  if ("error" in r) return { error: r.error };
  await startSession(r.id);
  redirect(safeNext(form.get("next")));
}

export async function signOut() {
  await endSession();
  redirect("/");
}

async function requireUser(next: string) {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

const validProperty = (id: string) => Boolean(getSnapshot()?.properties.some((p) => p.address_id === id));

export async function toggleSaveProperty(form: FormData) {
  const propertyId = String(form.get("property_id") ?? "");
  const back = `/app/properties/${encodeURIComponent(propertyId)}`;
  const user = await requireUser(back);
  if (!validProperty(propertyId)) return;
  const d = getDb();
  if (db.isSaved(d, user.id, propertyId)) db.unsaveProperty(d, user.id, propertyId);
  else db.saveProperty(d, user.id, propertyId);
  revalidatePath(back);
  revalidatePath("/app/saved");
}

// Saves the evaluated report pinned to the snapshot it was computed from.
export async function saveReportAction(form: FormData) {
  const propertyId = String(form.get("property_id") ?? "");
  const asOf = String(form.get("as_of") ?? "");
  const user = await requireUser(`/app/properties/${encodeURIComponent(propertyId)}?asOf=${asOf}`);
  const snap = getSnapshot();
  if (!snap || !isDate(asOf)) return;
  const r = resolveFor(snap, propertyId, asOf);
  if (!r) return;
  const evaluations = r.resolution.evaluations;
  const id = db.saveReport(getDb(), user.id, propertyId, snap.id, asOf, {
    snapshot_id: snap.id, engine_version: snap.engine_version, as_of: asOf, property: r.property, evaluations, blocking: r.resolution.blocking, evidence: r.evidence.records,
    rules: snap.rules.filter((x) => evaluations.some((e) => e.rule_id === x.team_rule_id && e.result !== "not_applicable")),
    disclaimer: "Legal information, not legal advice.",
  });
  redirect(`/app/saved?report=${id}`);
}

export async function deleteReportAction(form: FormData) {
  const user = await requireUser("/app/saved");
  db.deleteReport(getDb(), user.id, Number(form.get("id")));
  revalidatePath("/app/saved");
}
