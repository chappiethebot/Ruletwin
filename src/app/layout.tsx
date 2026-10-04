import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { Nav } from "@/components/nav";
import { HOSTED_DEMO, currentUser } from "@/lib/auth";
import { signOut } from "@/lib/actions";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "RuleTwin — rental housing rules by address",
  description: "Which rental housing rules apply at this address on this date, with citations. Legal information, not legal advice.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = HOSTED_DEMO ? null : await currentUser();
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col antialiased">
        <header className="sticky top-0 z-30 border-b border-line/70 bg-white/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1180px] items-center gap-x-5 px-4 sm:gap-x-8 lg:px-8">
            <Link href="/" className="flex min-h-14 items-center gap-2 text-[17px] font-semibold tracking-tight">
              <span aria-hidden className="block size-2 rounded-full bg-accent" /> RuleTwin
            </Link>
            <div className="ml-auto min-w-0 overflow-x-auto md:ml-0">
              <Nav signedIn={!!user} />
            </div>
            {!HOSTED_DEMO && (
              <div className="ml-auto hidden items-center gap-3 text-[14px] sm:flex">
                {user ? (
                  <>
                    <span className="hidden text-muted lg:inline">{user.email}</span>
                    <form action={signOut}><button className="min-h-11 rounded-full px-3 hover:bg-bg">Sign out</button></form>
                  </>
                ) : (
                  <Link href="/login" className="flex min-h-9 items-center rounded-full bg-ink px-4 font-medium text-white transition-colors hover:bg-black">Sign in</Link>
                )}
              </div>
            )}
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer>
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-[13px] text-muted lg:px-8">
            <span>Legal information, not legal advice.</span>
            <span className="flex gap-4 md:ml-auto">
              <a className="transition-colors hover:text-ink" href="https://github.com/chappiethebot/Ruletwin/blob/main/docs/METHOD_NOTE.md">Method</a>
              <a className="transition-colors hover:text-ink" href="/api/export/rules.json">Rules data</a>
              <a className="transition-colors hover:text-ink" href="/api/export/lookups.json">Lookups</a>
              <a className="transition-colors hover:text-ink" href="/api/export/changes.json">Changes</a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
