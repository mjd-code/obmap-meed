/**
 * Notion-like minimal table of contents: a column of tiny bars pinned to the
 * right edge that expands into a full outline on hover / focus.
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib";
import type { HeadingNode } from "./headingTree";

interface FloatingTocProps {
  headings: HeadingNode[];
  activeId?: string | null;
  onSelect: (heading: HeadingNode) => void;
  className?: string;
}

export const FloatingToc = ({
  headings,
  activeId,
  onSelect,
  className,
}: FloatingTocProps) => {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    [],
  );

  if (headings.length === 0) return null;

  const show = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  return (
    <nav
      aria-label="Table of contents"
      className={cn(
        "absolute right-2 top-1/2 z-50 -translate-y-1/2 select-none",
        className,
      )}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) hide();
      }}
    >
      {/* Mini mode — always visible */}
      <div
        aria-hidden={open}
        className={cn(
          "flex flex-col items-end gap-[3px] py-1 pr-1 transition-opacity duration-200",
          open ? "pointer-events-none opacity-0" : "opacity-70",
        )}
      >
        {headings.map((h) => (
          <span
            key={h.id}
            className={cn(
              "h-[2px] rounded-full transition-colors duration-200",
              h.id === activeId ? "bg-foreground" : "bg-muted-foreground/40",
            )}
            style={{ width: `${Math.max(8, 22 - (h.level - 1) * 3)}px` }}
          />
        ))}
      </div>

      {/* Full mode — hover / focus only */}
      <div
        aria-expanded={open}
        className={cn(
          "absolute right-0 top-1/2 max-h-[60vh] w-max -translate-y-1/2 overflow-y-auto rounded-lg border border-border/40 bg-popover/95 py-2 pl-2 pr-3 shadow-lg backdrop-blur-sm transition-all duration-200 toc-scroll",
          open
            ? "pointer-events-auto translate-x-0 opacity-100"
            : "pointer-events-none translate-x-2 opacity-0",
        )}
      >
        <ul className="flex flex-col gap-0.5">
          {headings.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => onSelect(h)}
                title={h.label}
                className={cn(
                  "block max-w-[32ch] truncate rounded px-1.5 py-0.5 text-left text-[12px] leading-tight transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  h.id === activeId
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground",
                )}
                style={{ paddingLeft: `${(h.level - 1) * 10 + 6}px` }}
              >
                {h.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};
