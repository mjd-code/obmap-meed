import { Minus, Plus, Type } from "lucide-react";
import { Button } from "@/global/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/global/ui/popover";
import { cn } from "@/global/utils";
import { useThemeStore } from "@/domains/settings/shared/stores/useThemeStore";
import type { CanonicalThemePresetId } from "@/domains/settings/shared/utils/themePresets";

const READER_PRESET_OPTIONS: Array<{
  id: CanonicalThemePresetId;
  label: string;
  swatchClass: string;
}> = [
  { id: "daylight-paper", label: "Paper", swatchClass: "bg-[#faf8f4] border-border" },
  { id: "warm-sepia", label: "Sepia", swatchClass: "bg-[#f3ead9] border-border" },
  { id: "vk-midnight", label: "Midnight", swatchClass: "bg-[#12121b] border-primary/50" },
  { id: "obsidian-oled", label: "OLED", swatchClass: "bg-black border-border" },
];

const PROSE_FONT_OPTIONS = [
  { id: "Inter", label: "Sans (Inter)" },
  { id: "Newsreader", label: "Serif (Newsreader)" },
] as const;

const MIN_PROSE_SIZE = 14;
const MAX_PROSE_SIZE = 22;

export function PublicReaderQuickPreferencesPopover() {
  const appearance = useThemeStore((s) => s.appearance);
  const setPreset = useThemeStore((s) => s.setPreset);
  const updateTypography = useThemeStore((s) => s.updateTypography);

  const proseSize = appearance.typography.proseSize;
  const activeFont = appearance.typography.proseFont;

  const setProseSize = (next: number) => {
    const clamped = Math.min(MAX_PROSE_SIZE, Math.max(MIN_PROSE_SIZE, next));
    updateTypography({ proseSize: clamped });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Preferensi Tampilan Pembaca"
          title="Preferensi Tampilan Pembaca"
        >
          <Type className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3 space-y-3 bg-popover border-border shadow-lg">
        <div className="space-y-1.5">
          <span className="vk-text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tema Baca
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {READER_PRESET_OPTIONS.map((preset) => {
              const isActive = appearance.presetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setPreset(preset.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors",
                    isActive
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border/70 bg-background/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className={cn("h-3 w-3 rounded-full border shrink-0", preset.swatchClass)} />
                  <span className="truncate">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="vk-text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            Jenis Huruf
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {PROSE_FONT_OPTIONS.map((font) => {
              const isActive = activeFont === font.id;
              return (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => updateTypography({ proseFont: font.id })}
                  aria-pressed={isActive}
                  className={cn(
                    "rounded-md border px-2 py-1.5 text-xs font-medium transition-colors truncate",
                    isActive
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border/70 bg-background/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {font.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <span className="vk-text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ukuran Teks
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={proseSize <= MIN_PROSE_SIZE}
              onClick={() => setProseSize(proseSize - 1)}
              aria-label="Perkecil teks bacaan"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-10 text-center font-mono text-xs tabular-nums text-foreground">
              {proseSize}px
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={proseSize >= MAX_PROSE_SIZE}
              onClick={() => setProseSize(proseSize + 1)}
              aria-label="Perbesar teks bacaan"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
