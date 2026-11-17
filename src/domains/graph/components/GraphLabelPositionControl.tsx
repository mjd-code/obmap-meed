import { Label } from '@/global/ui/label';
import type { UnboxedLabelPosition } from '@/domains/graph/shared/stores/useGraphStore';

const LABEL_POSITION_OPTIONS: Array<{
  id: UnboxedLabelPosition;
  label: string;
  hint: string;
}> = [
  { id: 'auto', label: 'Otomatis', hint: 'Knowledge: bawah dot · Mindmap: samping dot' },
  { id: 'beside', label: 'Di Samping', hint: 'Teks selalu di samping dot node' },
  { id: 'below', label: 'Di Bawah', hint: 'Teks selalu terpusat di bawah dot node' },
];

export interface GraphLabelPositionControlProps {
  value?: UnboxedLabelPosition;
  onChange: (value: UnboxedLabelPosition) => void;
  compact?: boolean;
}

/**
 * Shared 3-way selector for unboxed ('With Text') label placement relative to the node dot.
 */
export function GraphLabelPositionControl({
  value = 'auto',
  onChange,
  compact = false,
}: GraphLabelPositionControlProps) {
  const activeOption =
    LABEL_POSITION_OPTIONS.find((opt) => opt.id === value) ?? LABEL_POSITION_OPTIONS[0];

  return (
    <div className="space-y-1.5">
      {compact ? (
        <span className="vk-text-xs font-medium text-muted-foreground">
          Posisi Teks (With Text)
        </span>
      ) : (
        <Label className="text-sm font-medium">Posisi Teks (With Text)</Label>
      )}
      <div
        role="group"
        aria-label="Posisi Teks Mode With Text"
        className="grid grid-cols-3 gap-1 rounded-lg border border-border/60 bg-muted/40 p-1"
      >
        {LABEL_POSITION_OPTIONS.map((opt) => {
          const isActive = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(opt.id)}
              className={`py-1 px-1.5 vk-text-xs font-medium rounded transition-all truncate ${
                isActive
                  ? 'bg-background text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <p className="vk-text-2xs text-muted-foreground">{activeOption.hint}</p>
    </div>
  );
}
