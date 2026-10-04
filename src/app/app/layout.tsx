export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-[1180px] px-4 py-8 lg:px-8 lg:py-12">{children}</main>;
}
