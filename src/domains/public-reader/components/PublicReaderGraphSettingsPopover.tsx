/**
 * PublicGraphSettingsPopover
 *
 * Panel kontrol visual melayang (floating gear widget) di pojok kiri bawah graf publik.
 * Memungkinkan pembaca publik menyesuaikan tema, label, visibilitas node, pilihan layout,
 * serta jarak relasi tanpa memengaruhi workspace internal penulis.
 */

import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/global/ui/popover";
import { Button } from "@/global/ui/button";
import { Separator } from "@/global/ui/separator";
import { Badge } from "@/global/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/global/ui/tooltip";
import type { GraphConfigState } from "@/domains/graph/shared/stores/useGraphStore";
import type { LayoutMode } from "@/domains/graph/shared/utils/graph.types";
import {
  AVAILABLE_LAYOUTS,
  GRAPH_THEME_PRESETS,
  type ColorThemePreset,
  usePublicReaderGraphSettingsController,
} from "@/domains/public-reader/shared/hooks/usePublicReaderGraphSettingsController";
import { PublicReaderGraphSettingsSections } from "@/domains/public-reader/components/PublicReaderGraphSettingsSections";
import { Settings2, RotateCcw, Maximize2, Palette, Network, Sparkles } from "lucide-react";

export { AVAILABLE_LAYOUTS, GRAPH_THEME_PRESETS };
export type { ColorThemePreset };

export interface PublicGraphSettingsPopoverProps {
  config: GraphConfigState;
  onConfigChange: (updater: (prev: GraphConfigState) => GraphConfigState) => void;
  currentLayout: LayoutMode;
  onLayoutChange: (mode: LayoutMode) => void;
  onResetDefaults: () => void;
  onFitCamera: () => void;
}

/**
 * Pure declarative floating popover for public graph layout, theme preset, and visual controls.
 */
export const PublicGraphSettingsPopover: React.FC<PublicGraphSettingsPopoverProps> = ({
  config,
  onConfigChange,
  currentLayout,
  onLayoutChange,
  onResetDefaults,
  onFitCamera,
}) => {
  const {
    activeThemeId,
    activeThemeName,
    handleApplyTheme,
    handleReset,
    updateNodeOption,
    updateForceOption,
  } = usePublicReaderGraphSettingsController({
    onConfigChange,
    onResetDefaults,
  });

  return (
    <TooltipProvider delayDuration={250}>
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full border border-border/80 bg-background/90 backdrop-blur-md shadow-md hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
              >
                <Settings2 className="w-4 h-4 text-primary" />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Pengaturan Graf Publik
          </TooltipContent>
        </Tooltip>

        {/* Floating Settings Cockpit Panel */}
        <PopoverContent
          side="top"
          align="start"
          sideOffset={8}
          className="w-80 sm:w-96 p-3 rounded-2xl border border-border/80 bg-card/98 backdrop-blur-xl shadow-2xl text-xs select-none z-50 max-h-[440px] overflow-x-hidden overflow-y-auto [scrollbar-width:thin] [scrollbar-color:hsl(var(--muted-foreground)/0.25)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40"
        >
          {/* Header Panel */}
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Pengaturan Graf Publik</span>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onFitCamera}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Fokus Seluruh Graf</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleReset}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Reset ke Default</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="space-y-3.5 pt-2">
            {/* 1. Pilihan Layout */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 font-medium text-foreground text-[11px]">
                <Network className="w-3 h-3 text-primary" />
                <span>Pilihan Layout</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {AVAILABLE_LAYOUTS.map((layout) => {
                  const isActive = currentLayout === layout.id;
                  return (
                    <button
                      key={layout.id}
                      onClick={() => onLayoutChange(layout.id)}
                      className={`flex flex-col text-left px-2 py-1.5 rounded-lg border transition-all ${
                        isActive
                          ? "bg-primary/10 border-primary text-primary font-medium"
                          : "bg-background/40 border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span className="text-[11px] font-semibold">{layout.label}</span>
                      <span className="text-[9px] opacity-75 leading-tight truncate">
                        {layout.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* 2. Tema Warna */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-medium text-foreground text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Palette className="w-3 h-3 text-primary" />
                  <span>Tema Warna</span>
                </div>
                <Badge variant="outline" className="text-[9px] h-4 font-normal px-1.5">
                  {activeThemeName}
                </Badge>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                {GRAPH_THEME_PRESETS.map((preset) => {
                  const isSelected = activeThemeId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleApplyTheme(preset)}
                      title={preset.name}
                      className={`relative w-6 h-6 rounded-full border-2 transition-transform flex items-center justify-center p-0.5 ${
                        isSelected
                          ? "border-primary scale-110 shadow-sm"
                          : "border-border hover:scale-105"
                      }`}
                    >
                      <div
                        className="w-full h-full rounded-full"
                        style={{
                          background: `linear-gradient(135deg, ${preset.fileColor} 50%, ${preset.folderColor} 50%)`,
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <PublicReaderGraphSettingsSections
              config={config}
              onUpdateNodeOption={updateNodeOption}
              onUpdateForceOption={updateForceOption}
            />
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
};
