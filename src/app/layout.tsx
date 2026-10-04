import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { Nav } from "@/components/nav";
import { HOSTED_DEMO, currentUser } from "@/lib/auth";
import { signOut } from "@/lib/actions";
import { getSnapshot } from "@/lib/data";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "RuleTwin — rental housing rules by address",
  description: "Which rental housing rules apply at this address on this date, with citations. Legal information, not legal advice.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = HOSTED_DEMO ? null : await currentUser();
  const snap = getSnapshot();
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col antialiased">
        <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-8 px-4 lg:px-8">
            <Link href="/" className="flex min-h-14 items-center gap-2 text-[17px] font-semibold tracking-tight">
              <span aria-hidden className="block size-2.5 rounded-full bg-accent" /> RuleTwin
            </Link>
            <div className="order-last -mx-4 w-[calc(100%+2rem)] overflow-x-auto border-t border-line px-4 md:order-none md:mx-0 md:w-auto md:border-0 md:px-0">
              <Nav signedIn={!!user} />
            </div>
            {!HOSTED_DEMO && (
              <div className="ml-auto flex items-center gap-3 text-[14px]">
                {user ? (
                  <>
                    <span className="hidden text-muted lg:inline">{user.email}</span>
                    <form action={signOut}><button className="min-h-11 rounded-full px-3 hover:bg-bg">Sign out</button></form>
                  </>
                ) : (
                  <Link href="/login" className="flex min-h-10 items-center rounded-full bg-ink px-4 font-medium text-white hover:bg-black">Sign in</Link>
                )}
              </div>
            )}
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-[13px] text-muted lg:px-8">
            <span className="font-semibold text-ink">RuleTwin</span>
            <span>Legal information, not legal advice.</span>
            {snap && <span>Snapshot <span className="font-mono">{snap.id}</span> · {snap.rule_count} rules · {snap.property_count} properties</span>}
            <span className="flex gap-3 md:ml-auto">
              <a className="hover:text-ink" href="/api/export/rules.json">rules.json</a>
              <a className="hover:text-ink" href="/api/export/lookups.json">lookups.json</a>
              <a className="hover:text-ink" href="/api/export/changes.json">changes.json</a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
