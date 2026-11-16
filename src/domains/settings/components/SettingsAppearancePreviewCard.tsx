/**
 * Sticky Live Preview Card for SettingsAppearanceSection (<= 180 lines, pure JSX).
 * Demonstrates live DOM surfaces, semantic badges, Prose typography, Canvas2D graph, and WCAG score.
 */

import { Badge } from '@/global/ui/badge';
import { Button } from '@/global/ui/button';
import type { ContrastEvaluation } from '@/global/utils/color-utils';
import type { AppearanceConfig } from '@/domains/settings/shared/stores/useThemeStore';
import { CheckCircle2, Lock, Sparkles, TriangleAlert } from 'lucide-react';

export interface SettingsAppearancePreviewCardProps {
  presetLabel: string;
  appearance: AppearanceConfig;
  contrastReport: ContrastEvaluation;
  sourceLayer: string;
  isLockedByAdmin: boolean;
  onAutoAdjustContrast: () => void;
}

export function SettingsAppearancePreviewCard({
  presetLabel,
  appearance,
  contrastReport,
  sourceLayer,
  isLockedByAdmin,
  onAutoAdjustContrast,
}: SettingsAppearancePreviewCardProps) {
  const complianceTag = contrastReport.passesAAA
    ? 'WCAG AAA'
    : contrastReport.passesAA
      ? 'WCAG AA'
      : 'Low Contrast';

  return (
    <aside
      aria-label="Live appearance preview"
      className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="vk-text-xs font-semibold text-foreground truncate">
              Live Preview · {presetLabel}
            </span>
          </div>
          <p className="vk-text-2xs text-muted-foreground mt-0.5 uppercase tracking-wide">
            Layer: {sourceLayer} · {appearance.layout.density}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isLockedByAdmin && (
            <Badge
              variant="outline"
              className="vk-text-2xs gap-1 border-warning/40 bg-warning/10 text-warning"
            >
              <Lock className="h-2.5 w-2.5" />
              Org Lock
            </Badge>
          )}
          <Badge
            variant="outline"
            className={
              contrastReport.passesAA
                ? 'vk-text-2xs gap-1 border-success/40 bg-success/15 text-success'
                : 'vk-text-2xs gap-1 border-danger/40 bg-danger/15 text-danger'
            }
          >
            {contrastReport.passesAA ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <TriangleAlert className="h-3 w-3" />
            )}
            {contrastReport.ratio}:1 · {complianceTag}
          </Badge>
        </div>
      </div>

      {!contrastReport.passesAA && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onAutoAdjustContrast}
          className="w-full h-7 vk-text-xs"
        >
          Auto-adjust contrast ({'>='} 4.5:1)
        </Button>
      )}

      {/* 1. Mini Workbench & Semantic States */}
      <div
        className="rounded-lg border border-border bg-background p-3 space-y-2"
        style={{ borderRadius: 'var(--vk-radius-md)' }}
      >
        <div
          className="flex items-center justify-between px-2 rounded bg-muted/50"
          style={{ height: 'var(--vk-row-h-sm)' }}
        >
          <span className="vk-text-xs font-medium text-foreground">Workbench Item</span>
          <span className="vk-text-2xs text-muted-foreground font-mono">
            {Math.round(appearance.typography.uiScale * 100)}%
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="vk-text-2xs px-2 py-0.5 rounded bg-success/15 text-success font-medium">
            Synced
          </span>
          <span className="vk-text-2xs px-2 py-0.5 rounded bg-warning/15 text-warning font-medium">
            Review
          </span>
          <span className="vk-text-2xs px-2 py-0.5 rounded bg-danger/15 text-danger font-medium">
            Conflict
          </span>
          <span className="vk-text-2xs px-2 py-0.5 rounded bg-info/15 text-info font-medium">
            Draft
          </span>
        </div>
      </div>

      {/* 2. Mini Markdown Prose & Code Snippet */}
      <div className="rounded-lg border border-border bg-background p-3 space-y-2">
        <p
          className="text-foreground leading-snug"
          style={{
            fontFamily: 'var(--vk-font-prose)',
            fontSize: `${Math.min(16, Math.max(12, appearance.typography.proseSize - 2))}px`,
          }}
        >
          Knowledge graph synthesis connects{' '}
          <span className="text-primary underline decoration-dotted">[[Atomic Notes]]</span>{' '}
          across domains.
        </p>
        <pre className="rounded bg-muted/60 px-2.5 py-1.5 vk-text-2xs font-mono text-muted-foreground overflow-x-auto">
          <code>{`const ratio = ${contrastReport.ratio};`}</code>
        </pre>
      </div>

      {/* 3. Mini Canvas2D Graph Token Preview */}
      <div
        className="rounded-lg border border-border p-3"
        style={{ backgroundColor: 'hsl(var(--canvas-bg))' }}
      >
        <svg viewBox="0 0 220 68" className="w-full h-16" role="img" aria-label="Graph token preview">
          <line
            x1="44"
            y1="34"
            x2="110"
            y2="20"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeOpacity="0.65"
          />
          <line
            x1="110"
            y1="20"
            x2="176"
            y2="42"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeOpacity="0.65"
          />
          <circle cx="44" cy="34" r="10" fill="hsl(var(--folder-node))" />
          <circle cx="110" cy="20" r="11" fill="hsl(var(--accent))" />
          <circle cx="176" cy="42" r="9" fill="hsl(var(--file-node))" />
        </svg>
      </div>
    </aside>
  );
}
