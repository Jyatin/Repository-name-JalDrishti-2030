"use client";

import { useEffect, useState } from "react";
import { GradeChip, SyntheticTag } from "./GradeChip";
import type { ProvenanceNode } from "@/types";

/**
 * The screen the whole project exists to produce.
 *
 * The paper's Stage 6 validation gate reads: "users can trace recommendations
 * to data and assumptions." This drawer is that gate. Every node states what it
 * is, what it assumed, the resolution grade it rests on, and whether the value
 * underneath it was fabricated.
 */
export function ProvenanceDrawer({
  open,
  onClose,
  title,
  subtitle,
  tree,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  tree: ProvenanceNode[];
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close trace"
        onClick={onClose}
        className="absolute inset-0 bg-ink/20"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Trace for ${title}`}
        className="reveal relative flex h-full w-full max-w-[460px] flex-col border-l border-hairline bg-panel shadow-2xl"
      >
        <header className="hair-b flex items-start justify-between gap-4 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-ink-3">
              Trace to source
            </p>
            <h2 className="mt-0.5 truncate text-[19px]">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-[12px] leading-snug text-ink-2">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="-mr-1 -mt-1 shrink-0 rounded p-1.5 text-ink-3 transition-colors hover:bg-panel-2 hover:text-ink"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
              <path
                d="M3.5 3.5l8 8M11.5 3.5l-8 8"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
            <span className="sr-only">Close</span>
          </button>
        </header>

        <div className="thin-scroll flex-1 overflow-y-auto px-5 py-4">
          <ol className="relative">
            {tree.map((node, i) => (
              <TraceNode
                key={`${node.label}-${i}`}
                node={node}
                depth={0}
                last={i === tree.length - 1}
              />
            ))}
          </ol>
        </div>

        <footer className="hair-t px-5 py-3">
          <p className="text-[11px] leading-snug text-ink-3">
            Nothing in this chain is executed automatically. JalDrishti is a
            decision-support layer; a recommendation is a proposal for human
            review, not an instruction to the network.
          </p>
        </footer>
      </aside>
    </div>
  );
}

function TraceNode({
  node,
  depth,
  last,
}: {
  node: ProvenanceNode;
  depth: number;
  last: boolean;
}) {
  const [open, setOpen] = useState(depth < 2);
  const hasChildren = Boolean(node.children?.length);

  return (
    <li className="relative pl-5">
      {/* Spine connecting the chain, stopping at the final node. */}
      {!last && (
        <span className="absolute left-[5px] top-4 bottom-0 w-px bg-hairline" />
      )}
      <span
        className={`absolute left-[2px] top-[7px] h-[7px] w-[7px] rounded-full border ${
          depth === 0
            ? "border-coral bg-coral"
            : "border-hairline-2 bg-panel"
        }`}
      />

      <div className="pb-3.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {hasChildren ? (
            <button
              onClick={() => setOpen((v) => !v)}
              className="text-left text-[13px] font-semibold text-ink transition-colors hover:text-coral"
              aria-expanded={open}
            >
              {node.label}
            </button>
          ) : (
            <span className="text-[13px] font-semibold text-ink">
              {node.label}
            </span>
          )}
          {node.grade && <GradeChip grade={node.grade} size="xs" />}
          {node.synthetic && <SyntheticTag compact />}
          {hasChildren && (
            <span className="figure text-[10px] text-ink-3">
              {open ? "−" : `+${node.children!.length}`}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11.5px] leading-snug text-ink-2">
          {node.detail}
        </p>
      </div>

      {hasChildren && open && (
        <ol className="relative -mt-1">
          {node.children!.map((child, i) => (
            <TraceNode
              key={`${child.label}-${i}`}
              node={child}
              depth={depth + 1}
              last={i === node.children!.length - 1}
            />
          ))}
        </ol>
      )}
    </li>
  );
}
