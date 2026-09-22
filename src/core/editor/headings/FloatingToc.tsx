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
    closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  };

  return (
    <nav
      aria-label="Table of contents"
      className={cn(
        "absolute right-3 top-1/2 z-50 -translate-y-1/2 select-none",
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
          "flex flex-col items-end gap-1.5 py-2 pr-1 transition-opacity duration-200",
          open ? "pointer-events-none opacity-0" : "opacity-80",
        )}
      >
        {headings.map((h) => {
          const isActive = h.id === activeId;
          return (
            <span
              key={h.id}
              className={cn(
                "rounded-full transition-all duration-200",
                isActive
                  ? "bg-foreground"
                  : "bg-muted-foreground/35",
              )}
              style={{
                width: `${Math.max(10, 20 - (h.level - 1) * 2.5)}px`,
                height: isActive ? "3px" : "2.5px",
              }}
            />
          );
        })}
      </div>

      {/* Full mode — hover / focus only */}
      <div
        aria-expanded={open}
        className={cn(
          "absolute right-0 top-1/2 max-h-[65vh] w-max -translate-y-1/2 overflow-y-auto rounded-lg border border-border/50 bg-popover/95 py-2.5 pl-2 pr-3 shadow-lg backdrop-blur-sm transition-all duration-200 toc-scroll",
          open
            ? "pointer-events-auto translate-x-0 opacity-100"
            : "pointer-events-none translate-x-3 opacity-0",
        )}
      >
        <ul className="flex flex-col gap-0.5">
          {headings.map((h) => {
            const isActive = h.id === activeId;
            return (
              <li key={h.id}>
                <button
                  type="button"
                  onClick={() => onSelect(h)}
                  title={h.label}
                  className={cn(
                    "block max-w-[32ch] truncate rounded px-1.5 py-1 text-left text-[12.5px] leading-tight transition-colors",
                    "hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    isActive
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground",
                  )}
                  style={{ paddingLeft: `${(h.level - 1) * 11 + 6}px` }}
                >
                  {h.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};