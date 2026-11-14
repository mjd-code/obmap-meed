import { useMemo, useRef, useState } from "react";
import { Input } from "@/global/ui/input";
import { Badge } from "@/global/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/global/utils";
import {
  normalizeTag,
  tagSegments,
} from "@/domains/editor/shared/utils/frontmatterUtils";

interface ListValueInputProps {
  isTags: boolean;
  values: string[];
  suggestions: string[];
  onChange: (next: string[]) => void;
}

/** Inline chip-list input with drag reordering and tag/value autocomplete. */
export const ListValueInput = ({
  isTags,
  values,
  suggestions,
  onChange,
}: ListValueInputProps) => {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const dragIndex = useRef<number | null>(null);

  const matches = useMemo(() => {
    const q = (isTags ? normalizeTag(draft) : draft.trim()).toLowerCase();
    if (!q) return [];
    return suggestions
      .filter((s: string) => s.toLowerCase().includes(q) && !values.includes(s))
      .slice(0, 6);
  }, [draft, suggestions, values, isTags]);

  const add = (raw: string) => {
    const item = isTags ? normalizeTag(raw) : raw.trim();
    setDraft("");
    setOpen(false);
    if (!item || values.includes(item)) return;
    onChange([...values, item]);
  };

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= values.length) return;
    const next = [...values];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="relative flex w-full flex-wrap items-center gap-1.5 px-2">
      {values.map((item: string, index: number) => {
        const segments = tagSegments(item);
        return (
          <Badge
            key={item}
            variant="secondary"
            draggable
            onDragStart={() => (dragIndex.current = index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex.current !== null) move(dragIndex.current, index);
              dragIndex.current = null;
            }}
            className="cursor-grab gap-0.5 px-1.5 py-0 text-[11px] font-normal text-muted-foreground bg-muted hover:bg-muted/80"
          >
            {isTags && segments.length > 1 ? (
              segments.map((seg, i) => (
                <span
                  key={`${seg}-${i}`}
                  className={cn(i > 0 && "font-medium text-foreground")}
                >
                  {i > 0 && (
                    <span className="mx-0.5 text-muted-foreground/40">/</span>
                  )}
                  {seg}
                </span>
              ))
            ) : (
              <span className="text-foreground">{item}</span>
            )}
            <button
              type="button"
              onClick={() => onChange(values.filter((v: string) => v !== item))}
              className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        );
      })}
      <Input
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(matches.length === 1 ? matches[0] : draft);
          }
          if (e.key === "Backspace" && !draft && values.length) {
            onChange(values.slice(0, -1));
          }
          if (e.key === "Escape") setOpen(false);
        }}
        onBlur={() => setTimeout(() => add(draft), 120)}
        placeholder={values.length === 0 ? "Empty" : ""}
        className={cn(
          "h-6 flex-1 min-w-[60px] border-none bg-transparent px-0 text-xs shadow-none placeholder:text-muted-foreground/40 focus-visible:ring-0",
          values.length === 0 &&
            "hover:bg-black/5 dark:hover:bg-white/5 focus-visible:bg-black/5 dark:focus-visible:bg-white/5 px-2 -ml-2 rounded-md",
        )}
      />

      {open && matches.length > 0 && (
        <ul className="absolute left-0 top-full z-50 mt-1 max-h-44 w-56 overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
          {matches.map((m: string) => (
            <li key={m}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  add(m);
                }}
                className="w-full rounded px-2 py-1 text-left text-xs hover:bg-accent"
              >
                {m}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
