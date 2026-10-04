import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RuleTwin — rental housing rules by address",
  description: "Which rental housing rules apply at this address on this date, with citations. Legal information, not legal advice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
