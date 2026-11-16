/**
 * Appearance & Accessibility Settings Section (UI-STEP-02, <= 250 lines, pure JSX).
 * Driven by headless controller `useSettingsAppearanceController.ts`.
 */

import { Label } from '@/global/ui/label';
import {
  MODE_OPTIONS,
  MONO_FONT_OPTIONS,
  PROSE_FONT_OPTIONS,
  UI_FONT_OPTIONS,
  useSettingsAppearanceController,
} from '@/domains/settings/shared/hooks/useSettingsAppearanceController';
import { SettingsAppearancePreviewCard } from '@/domains/settings/components/SettingsAppearancePreviewCard';
import { SettingsAppearanceBehaviorPanel } from '@/domains/settings/components/SettingsAppearanceBehaviorPanel';
import { Check, Lock } from 'lucide-react';
import { cn } from '@/global/utils';

export function SettingsAppearanceSection() {
  const {
    appearance,
    presets,
    activePreset,
    contrastReport,
    isLockedByAdmin,
    sourceLayer,
    cssDraft,
    setCssDraft,
    rejectedRules,
    setMode,
    updateTypography,
    updateLayout,
    updateMotion,
    handleSelectPreset,
    handleAutoAdjustContrast,
    handleApplyCss,
    handleReset,
  } = useSettingsAppearanceController();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
      <fieldset disabled={isLockedByAdmin} className="space-y-6 min-w-0">
        {isLockedByAdmin && (
          <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-warning vk-text-xs">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span>
              Pengaturan Appearance dikunci oleh kebijakan organisasi ({sourceLayer}).
            </span>
          </div>
        )}

        {/* 1. Mode & Visual Theme Presets */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="vk-text-sm font-semibold text-foreground">Tema & Mode Warna</h2>
              <p className="vk-text-xs text-muted-foreground">
                Menyelaraskan tampilan DOM, Editor Markdown, Reader, dan kanvas graf.
              </p>
            </div>
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
              {MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMode(opt.value)}
                  className={cn(
                    'px-2.5 py-1 rounded-md vk-text-xs font-medium transition-colors',
                    appearance.mode === opt.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {presets.map((preset) => {
              const isSelected = activePreset.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  data-preset-id={preset.id}
                  aria-pressed={isSelected}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={cn(
                    'text-left rounded-lg border p-3 transition-all space-y-2',
                    isSelected
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                      : 'border-border bg-card hover:border-muted-foreground/40',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="vk-text-xs font-semibold text-foreground truncate">
                      {preset.label}
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-border"
                      style={{ backgroundColor: `hsl(${preset.colors.background})` }}
                    />
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-border"
                      style={{ backgroundColor: `hsl(${preset.colors.primary})` }}
                    />
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-border"
                      style={{ backgroundColor: `hsl(${preset.colors.accent})` }}
                    />
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-border"
                      style={{ backgroundColor: `hsl(${preset.colors.foreground})` }}
                    />
                  </div>
                  <p className="vk-text-2xs text-muted-foreground line-clamp-2">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Typography & Scale */}
        <section className="rounded-lg border border-border bg-card/50 p-4 space-y-4">
          <h2 className="vk-text-sm font-semibold text-foreground">Tipografi & Skala Teks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'ui-font', label: 'UI Font', value: appearance.typography.uiFont, options: UI_FONT_OPTIONS, key: 'uiFont' as const },
              { id: 'prose-font', label: 'Prose Font', value: appearance.typography.proseFont, options: PROSE_FONT_OPTIONS, key: 'proseFont' as const },
              { id: 'mono-font', label: 'Mono Font', value: appearance.typography.monoFont, options: MONO_FONT_OPTIONS, key: 'monoFont' as const },
            ].map((field) => (
              <div key={field.id} className="space-y-1.5">
                <Label htmlFor={field.id} className="vk-text-xs text-muted-foreground">
                  {field.label}
                </Label>
                <select
                  id={field.id}
                  value={field.value}
                  onChange={(e) => updateTypography({ [field.key]: e.target.value })}
                  className="w-full h-8 rounded-md border border-border bg-background px-2.5 vk-text-xs text-foreground"
                >
                  {field.options.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between vk-text-xs">
                <Label htmlFor="ui-scale">UI Scale</Label>
                <span className="font-mono text-muted-foreground">
                  {Math.round(appearance.typography.uiScale * 100)}%
                </span>
              </div>
              <input
                id="ui-scale"
                type="range"
                min="0.85"
                max="1.25"
                step="0.05"
                value={appearance.typography.uiScale}
                onChange={(e) => updateTypography({ uiScale: Number(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between vk-text-xs">
                <Label htmlFor="prose-size">Reading Size</Label>
                <span className="font-mono text-muted-foreground">
                  {appearance.typography.proseSize}px
                </span>
              </div>
              <input
                id="prose-size"
                type="range"
                min="12"
                max="24"
                step="1"
                value={appearance.typography.proseSize}
                onChange={(e) => updateTypography({ proseSize: Number(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between vk-text-xs">
                <Label htmlFor="prose-lh">Line Height</Label>
                <span className="font-mono text-muted-foreground">
                  {appearance.typography.lineHeight}
                </span>
              </div>
              <input
                id="prose-lh"
                type="range"
                min="1.4"
                max="2.0"
                step="0.05"
                value={appearance.typography.lineHeight}
                onChange={(e) => updateTypography({ lineHeight: Number(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>
          </div>
        </section>

        <SettingsAppearanceBehaviorPanel
          layout={appearance.layout}
          motion={appearance.motion}
          cssDraft={cssDraft}
          rejectedRules={rejectedRules}
          onUpdateLayout={updateLayout}
          onUpdateMotion={updateMotion}
          onCssDraftChange={setCssDraft}
          onApplyCss={handleApplyCss}
          onReset={handleReset}
        />
      </fieldset>

      {/* Right Sticky Live Preview */}
      <div className="xl:sticky xl:top-4">
        <SettingsAppearancePreviewCard
          presetLabel={activePreset.label}
          appearance={appearance}
          contrastReport={contrastReport}
          sourceLayer={sourceLayer}
          isLockedByAdmin={isLockedByAdmin}
          onAutoAdjustContrast={handleAutoAdjustContrast}
        />
      </div>
    </div>
  );
}
