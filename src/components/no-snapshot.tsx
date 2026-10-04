import { Card } from "./ui";

export function NoSnapshot() {
  return (
    <Card>
      <h1 className="text-[22px] font-semibold">No published rule snapshot</h1>
      <p className="mt-2 text-muted">
        Run <code className="font-mono">npm run extract</code> then <code className="font-mono">npm run publish</code> to build one from the corpus.
      </p>
    </Card>
  );
}
