"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/app/check", label: "Check address" },
  { href: "/app/changes", label: "Law changes" },
  { href: "/app/rules", label: "Rule library" },
  { href: "/app/saved", label: "Saved", auth: true },
];

export function Nav({ signedIn }: { signedIn: boolean }) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="flex gap-6">
      {ITEMS.filter((i) => !i.auth || signedIn).map(({ href, label }) => {
        const active = path.startsWith(href) || (href === "/app/check" && path.startsWith("/app/properties"));
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}
            className={`flex min-h-12 shrink-0 items-center border-b-2 text-[14px] md:min-h-14 ${active ? "border-accent font-semibold text-ink" : "border-transparent text-muted hover:text-ink"}`}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
