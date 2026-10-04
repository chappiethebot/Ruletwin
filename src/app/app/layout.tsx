import Link from "next/link";
import { Menu, Scale } from "lucide-react";
import { Nav } from "@/components/nav";
import { currentUser } from "@/lib/auth";
import { signOut } from "@/lib/actions";
import { getSnapshot } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const snap = getSnapshot();
  const brand = (
    <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
      <Scale aria-hidden size={20} className="text-teal" /> RuleTwin
    </Link>
  );
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[232px_1fr]">
      <aside className="hidden border-r border-line bg-card px-4 py-5 lg:flex lg:flex-col lg:gap-6">
        {brand}
        <Nav />
        <p className="mt-auto text-[12px] leading-snug text-muted">Legal information, not legal advice.</p>
      </aside>
      <div className="min-w-0">
        <header className="flex min-h-14 items-center gap-3 border-b border-line bg-card px-4 lg:px-8">
          <details className="relative lg:hidden">
            <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-lg border border-line" aria-label="Open navigation">
              <Menu aria-hidden size={18} />
            </summary>
            <div className="absolute left-0 top-12 z-20 w-64 rounded-xl border border-line bg-card p-3 shadow-lg"><Nav /></div>
          </details>
          <div className="lg:hidden">{brand}</div>
          <p className="hidden text-[13px] text-muted sm:block">
            {snap ? <>Snapshot <span className="font-mono">{snap.id}</span> · {snap.rule_count} rules · {snap.property_count} sample properties</>
              : "No published snapshot yet"}
          </p>
          <div className="ml-auto flex items-center gap-3 text-[14px]">
            {user ? (
              <>
                <span className="hidden text-muted sm:inline">{user.email}</span>
                <form action={signOut}><button className="min-h-11 rounded-lg px-3 text-teal hover:bg-teal-soft">Sign out</button></form>
              </>
            ) : (
              <Link href="/login" className="flex min-h-11 items-center rounded-lg px-3 font-medium text-teal hover:bg-teal-soft">Sign in</Link>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-[1180px] px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
