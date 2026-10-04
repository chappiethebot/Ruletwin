"use client";
import { useRef } from "react";
import { ExternalLink, FileText, X } from "lucide-react";
import type { Evidence } from "@/lib/data";

export function EvidenceDrawer({ evidence, title }: { evidence: Evidence; title: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const e = evidence;
  return (
    <>
      <button ref={trigger} type="button" onClick={() => ref.current?.showModal()}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line px-3 text-[14px] font-medium text-teal hover:bg-teal-soft">
        <FileText aria-hidden size={16} /> Source evidence
      </button>
      <dialog ref={ref} aria-label={`Evidence for ${title}`} onClose={() => trigger.current?.focus()}
        className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-[640px] overflow-y-auto bg-card p-0 text-ink shadow-xl sm:border-l sm:border-line">
        <div className="sticky top-0 flex items-start gap-3 border-b border-line bg-card px-5 py-4">
          <div className="min-w-0">
            <p className="text-[13px] uppercase tracking-wide text-muted">Source evidence</p>
            <h2 className="text-[18px] font-semibold">{title}</h2>
          </div>
          <button type="button" onClick={() => ref.current?.close()} aria-label="Close evidence"
            className="ml-auto flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-bg"><X aria-hidden size={18} /></button>
        </div>
        <div className="flex flex-col gap-5 px-5 py-5">
          <dl className="grid grid-cols-[130px_1fr] gap-x-3 gap-y-1.5 text-[14px]">
            <dt className="text-muted">Citation</dt><dd className="font-mono">{e.citation}</dd>
            <dt className="text-muted">Status</dt><dd>{e.status_kind}</dd>
            <dt className="text-muted">Effective</dt><dd className="font-mono">{e.effective_date ?? "not stated in source"}</dd>
            <dt className="text-muted">Document</dt><dd className="font-mono">{e.doc_id} · {e.source_type}</dd>
            <dt className="text-muted">Retrieved</dt><dd className="font-mono">{e.retrieved_at ?? "unknown"}</dd>
            <dt className="text-muted">Snapshot</dt><dd className="font-mono">{e.snapshot_id}</dd>
            <dt className="text-muted">Extracted by</dt><dd className="font-mono">{e.model}</dd>
          </dl>
          {e.url && (
            <a href={e.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 break-all text-[14px] text-teal underline">
              <ExternalLink aria-hidden size={14} /> {e.url}
            </a>
          )}
          <section>
            <h3 className="mb-2 text-[14px] font-semibold">Exact source text</h3>
            <div className="max-h-[320px] overflow-y-auto whitespace-pre-wrap rounded-lg border border-line bg-bg p-4 font-mono text-[13px] leading-relaxed">
              <span className="text-muted">{e.before}</span>
              <mark className="rounded bg-amber-soft px-0.5 text-ink outline outline-1 outline-amber/40">{e.quote}</mark>
              <span className="text-muted">{e.after}</span>
            </div>
            {!e.before && !e.after && <p className="mt-1 text-[13px] text-muted">Context unavailable; quote verified against the source at extraction.</p>}
          </section>
          {e.condition_quotes.length > 0 && (
            <section>
              <h3 className="mb-2 text-[14px] font-semibold">Condition and exemption sources</h3>
              <ul className="flex flex-col gap-2">
                {e.condition_quotes.map((c, i) => (
                  <li key={i} className="rounded-lg border border-line p-3 text-[14px]">
                    <p className="font-medium">{c.label}</p>
                    <p className="mt-1 font-mono text-[13px] text-muted">“{c.quote}”</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {e.review.length > 0 && (
            <section>
              <h3 className="mb-2 text-[14px] font-semibold">Extraction review notes</h3>
              <ul className="list-disc pl-5 text-[14px] text-muted">{e.review.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </section>
          )}
          <p className="text-[13px] text-muted">Legal information, not legal advice. Machine-extracted; verify against the official source.</p>
        </div>
      </dialog>
    </>
  );
}
