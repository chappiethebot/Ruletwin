import Link from "next/link";
import { redirect } from "next/navigation";
import { Scale } from "lucide-react";
import { Card } from "@/components/ui";
import { AuthForm } from "@/components/auth-form";
import { HOSTED_DEMO, currentUser, safeNext } from "@/lib/auth";

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = safeNext(sp.next);
  if (await currentUser()) redirect(next);
  return (
    <main className="mx-auto flex min-h-screen max-w-[440px] flex-col justify-center gap-6 px-4 py-10">
      <Link href="/" className="flex items-center gap-2 font-semibold"><Scale aria-hidden size={20} className="text-teal" /> RuleTwin</Link>
      {HOSTED_DEMO && (
        <p role="status" className="rounded-lg border border-amber/30 bg-amber-soft p-3 text-[14px] text-amber">
          This is the hosted read-only demo: address reports, evidence, changes and the rule library work without an account.
          Accounts and saving are available when RuleTwin runs locally (see the README).
        </p>
      )}
      <Card>
        <AuthForm next={next} />
      </Card>
      <p className="text-[13px] text-muted">
        Accounts are stored locally on this computer (demo deployment). Browsing sample properties works without an account; saving needs one.
        Legal information, not legal advice.
      </p>
    </main>
  );
}
