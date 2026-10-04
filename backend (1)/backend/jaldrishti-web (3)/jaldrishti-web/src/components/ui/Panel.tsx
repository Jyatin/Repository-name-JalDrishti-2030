import type { ReactNode } from "react";

interface PanelProps {
  title?: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: "default" | "sage" | "deep";
  bodyClassName?: string;
}

const TONE: Record<string, { wrap: string; head: string; title: string }> = {
  default: { wrap: "panel", head: "hair-b", title: "text-ink" },
  sage: {
    wrap: "rounded-[10px] border border-[#cbd6a8] bg-sage",
    head: "border-b border-[#cbd6a8]",
    title: "text-[#33401a]",
  },
  deep: {
    wrap: "rounded-[10px] border border-deep-2 bg-deep",
    head: "border-b border-deep-2",
    title: "text-[#e8eef0]",
  },
};

/** The one card shape used across the app. Hierarchy comes from tone, not radius. */
export function Panel({
  title,
  meta,
  children,
  className = "",
  tone = "default",
  bodyClassName = "p-4",
}: PanelProps) {
  const t = TONE[tone];
  return (
    <section className={`${t.wrap} overflow-hidden ${className}`}>
      {title && (
        <header
          className={`flex items-center justify-between gap-3 px-4 py-2.5 ${t.head}`}
        >
          <h3 className={`text-[13px] font-semibold tracking-[-0.01em] ${t.title}`}>
            {title}
          </h3>
          {meta && <div className="shrink-0">{meta}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
