"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, GitCompareArrows, Library, MapPin } from "lucide-react";

const ITEMS = [
  { href: "/app/check", label: "Check address", Icon: MapPin },
  { href: "/app/saved", label: "Saved properties", Icon: Bookmark },
  { href: "/app/changes", label: "Changes", Icon: GitCompareArrows },
  { href: "/app/rules", label: "Rule library", Icon: Library },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {ITEMS.map(({ href, label, Icon }) => {
        const active = path.startsWith(href) || (href === "/app/check" && path.startsWith("/app/properties"));
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] ${active ? "bg-teal-soft font-semibold text-teal" : "text-ink hover:bg-bg"}`}>
            <Icon aria-hidden size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
