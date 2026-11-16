/**
 * Layout Density, Radius, Accessibility Motion & Scoped CSS Snippets sub-panel (UI-STEP-02).
 */

import { Badge } from '@/global/ui/badge';
import { Button } from '@/global/ui/button';
import { Label } from '@/global/ui/label';
import { Switch } from '@/global/ui/switch';
import { Textarea } from '@/global/ui/textarea';
import {
  DENSITY_OPTIONS,
  RADIUS_OPTIONS,
} from '@/domains/settings/shared/hooks/useSettingsAppearanceController';
import type {
  AppearanceLayoutConfig,
  AppearanceMotionConfig,
} from '@/domains/settings/shared/stores/useThemeStore';
import { RotateCcw } from 'lucide-react';

export interface SettingsAppearanceBehaviorPanelProps {
  layout: AppearanceLayoutConfig;
  motion: AppearanceMotionConfig;
  cssDraft: string;
  rejectedRules: string[];
  onUpdateLayout: (patch: Partial<AppearanceLayoutConfig>) => void;
  onUpdateMotion: (patch: Partial<AppearanceMotionConfig>) => void;
  onCssDraftChange: (value: string) => void;
  onApplyCss: () => void;
  onReset: () => void;
}

export function SettingsAppearanceBehaviorPanel({
  layout,
  motion,
  cssDraft,
  rejectedRules,
  onUpdateLayout,
  onUpdateMotion,
  onCssDraftChange,
  onApplyCss,
  onReset,
}: SettingsAppearanceBehaviorPanelProps) {
  return (
    <>
      <section className="rounded-lg border border-border bg-card/50 p-4 space-y-4">
        <h2 className="vk-text-sm font-semibold text-foreground">
          Densitas, Sudut & Aksesibilitas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="vk-text-xs text-muted-foreground">Spatial Density</Label>
            <div className="flex flex-wrap gap-1.5">
              {DENSITY_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  size="sm"
                  variant={layout.density === opt.value ? 'default' : 'outline'}
                  onClick={() => onUpdateLayout({ density: opt.value })}
                  className="h-7 vk-text-xs"
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="vk-text-xs text-muted-foreground">Border Radius</Label>
            <div className="flex flex-wrap gap-1.5">
              {RADIUS_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  size="sm"
                  variant={layout.radiusPreset === opt.value ? 'default' : 'outline'}
                  onClick={() => onUpdateLayout({ radiusPreset: opt.value })}
                  className="h-7 vk-text-xs"
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
            <Label htmlFor="reduced-motion" className="vk-text-xs">
              Reduced Motion
            </Label>
            <Switch
              id="reduced-motion"
              checked={motion.reducedMotion}
              onCheckedChange={(checked) => onUpdateMotion({ reducedMotion: checked })}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
            <Label htmlFor="glass-effects" className="vk-text-xs">
              Glass Blur Effects
            </Label>
            <Switch
              id="glass-effects"
              checked={motion.glassEffects}
              onCheckedChange={(checked) => onUpdateMotion({ glassEffects: checked })}
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="vk-text-sm font-semibold text-foreground">Scoped CSS Snippets</h2>
            <p className="vk-text-2xs text-muted-foreground">
              Aturan CSS disanitasi otomatis dan di-scope ke <code>.vk-themed-root</code>.
            </p>
          </div>
          {rejectedRules.length > 0 && (
            <Badge
              variant="outline"
              className="vk-text-2xs border-warning/40 bg-warning/10 text-warning"
            >
              {rejectedRules.length} aturan ditolak
            </Badge>
          )}
        </div>
        <Textarea
          value={cssDraft}
          onChange={(e) => onCssDraftChange(e.target.value)}
          placeholder=".note-title { letter-spacing: 0.02em; }"
          className="min-h-[84px] font-mono vk-text-xs"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button type="button" size="sm" variant="outline" onClick={onApplyCss}>
            Terapkan Snippet
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onReset}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Appearance
          </Button>
        </div>
      </section>
    </>
  );
}
