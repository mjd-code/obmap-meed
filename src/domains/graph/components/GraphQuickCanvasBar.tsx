import {
  Network,
  GitBranch,
  FileCode2,
  Maximize2,
  LocateFixed,
  Link2,
  Sparkles,
  SlidersHorizontal,
  Palette,
  Layers,
} from 'lucide-react';
import { Button } from '@/global/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/global/ui/popover';
import { cn } from '@/global/utils';
import {
  useGraphQuickCanvasBarController,
  type QuickCanvasMode,
  type QuickStructureValue,
} from '@/domains/graph/shared/hooks/useGraphQuickCanvasBarController';
import type { SkeletonPresetId } from '@/domains/graph/shared/utils/graph.types';

export interface GraphQuickCanvasBarProps {
  isOutlineMode?: boolean;
  onToggleOutlineMode?: (active: boolean) => void;
  isInspectorOpen?: boolean;
  onToggleInspector?: () => void;
  onSmartZoom?: (action: 'fit' | 'selection' | 'reset') => void;
  className?: string;
}

const MODE_OPTIONS: Array<{ id: QuickCanvasMode; label: string; icon: typeof GitBranch }> = [
  { id: 'mindmap', label: 'Mindmap', icon: GitBranch },
  { id: 'graph', label: 'Knowledge', icon: Network },
  { id: 'outline', label: 'Note AST', icon: FileCode2 },
];

const STRUCTURE_OPTIONS: Array<{ value: QuickStructureValue; label: string }> = [
  { value: 'mindmap-balanced', label: 'Mindmap (Seimbang)' },
  { value: 'mindmap-radial', label: 'Mindmap (Radial)' },
  { value: 'org-chart', label: 'Org Chart (Atas-Bawah)' },
  { value: 'brace-map', label: 'Brace Map (Kiri-Kanan)' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'fishbone', label: 'Fishbone' },
  { value: 'free-force', label: 'Free Force Graph' },
];

const DEPTH_OPTIONS: Array<{ level: 1 | 2 | 3 | 'all'; label: string }> = [
  { level: 1, label: 'L1' },
  { level: 2, label: 'L2' },
  { level: 3, label: 'L3' },
  { level: 'all', label: 'All' },
];

/**
 * Layer 1 Floating Quick Canvas Bar (<= 5 daily control clusters, 38px compact glass bar).
 * Pure declarative JSX driven by `useGraphQuickCanvasBarController`.
 */
export function GraphQuickCanvasBar({
  isOutlineMode = false,
  onToggleOutlineMode,
  isInspectorOpen = false,
  onToggleInspector,
  onSmartZoom,
  className,
}: GraphQuickCanvasBarProps) {
  const ctrl = useGraphQuickCanvasBarController({
    onSmartZoom,
    isOutlineMode,
    onToggleOutlineMode,
  });

  return (
    <div
      role="toolbar"
      aria-label="Quick Canvas Bar"
      className={cn(
        'pointer-events-auto absolute top-3 left-1/2 -translate-x-1/2 z-30',
        'flex max-w-[calc(100vw-8.5rem)] items-center gap-1.5 overflow-x-auto no-scrollbar',
        'h-9 px-2 rounded-full border border-border/70 bg-card/90 backdrop-blur-md shadow-lg',
        'motion-reduce:transition-none',
        className,
      )}
    >
      {/* 1. Canvas Mode Switcher */}
      <div className="flex items-center rounded-full bg-muted/50 p-0.5 shrink-0">
        {MODE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = ctrl.activeCanvasTab === opt.id;
          const disabled = opt.id === 'outline' && !ctrl.hasSelectedFileNote && !isOutlineMode;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => ctrl.switchCanvasTab(opt.id)}
              title={
                disabled
                  ? 'Pilih catatan Markdown dahulu untuk Note AST Mindmap'
                  : `Mode ${opt.label}`
              }
              aria-pressed={isActive}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-1 vk-text-xs font-medium transition-colors',
                isActive
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
                disabled && 'opacity-40 cursor-not-allowed',
              )}
            >
              <Icon className="h-3 w-3 shrink-0" />
              <span className="hidden lg:inline">{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Global Structure Picker */}
      <select
        aria-label="Struktur Graf Global"
        value={ctrl.currentStructure}
        onChange={(e) => ctrl.selectStructure(e.target.value as QuickStructureValue)}
        className="h-7 rounded-full border border-border/60 bg-background/70 px-2.5 vk-text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring shrink-0"
      >
        {STRUCTURE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* 3. 1-Click Theme & Skeleton Swatches */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 rounded-full gap-1 vk-text-xs shrink-0"
            title="Skeleton Tema & Palet Cabang"
          >
            <Palette className="h-3.5 w-3.5 text-primary" />
            <span className="hidden xl:inline max-w-[90px] truncate">{ctrl.activeSkeleton.label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="center" className="w-60 p-2.5 space-y-2 bg-popover border-border shadow-xl">
          <span className="vk-text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
            Skeleton Preset (Visual Refresh)
          </span>
          <div className="space-y-1">
            {ctrl.skeletonList.map((preset) => {
              const isSelected = ctrl.activeSkeleton.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => ctrl.applySkeletonPreset(preset.id as SkeletonPresetId)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-md border px-2 py-1.5 vk-text-xs transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/10 text-foreground font-semibold'
                      : 'border-border/60 bg-background/60 text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span className="truncate">{preset.label}</span>
                  <span className="flex items-center gap-0.5 shrink-0">
                    {preset.seedPalette.slice(0, 4).map((hex, i) => (
                      <span
                        key={i}
                        className="h-2.5 w-2.5 rounded-full border border-border/40"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* 4. Relationship & Strict/Flex Toggles */}
      <div className="flex items-center gap-1 border-l border-border/50 pl-1.5 shrink-0">
        <Button
          type="button"
          variant={ctrl.showMindmapRelationships ? 'secondary' : 'ghost'}
          size="sm"
          onClick={ctrl.toggleShowRelationships}
          className="h-7 px-2 rounded-full gap-1 vk-text-xs"
          title="Tampilkan relasi [[Wikilinks]] di mode Mindmap"
          aria-pressed={ctrl.showMindmapRelationships}
        >
          <Link2 className="h-3.5 w-3.5" />
          <span className="hidden xl:inline">Links</span>
        </Button>

        <Button
          type="button"
          variant={ctrl.layoutArrangement === 'custom' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={ctrl.toggleArrangementMode}
          className="h-7 px-2 rounded-full gap-1 vk-text-xs"
          title={ctrl.layoutArrangement === 'custom' ? 'Kembali ke Strict & Tidy Up' : 'Buka Flex Offset Manual'}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{ctrl.layoutArrangement === 'custom' ? 'Flex' : 'Strict'}</span>
        </Button>
      </div>

      {/* 5. Viewport, Depth & Inspector Toggle */}
      <div className="flex items-center gap-1 border-l border-border/50 pl-1.5 shrink-0">
        <div className="hidden md:flex items-center rounded-full bg-muted/40 p-0.5">
          <Layers className="h-3 w-3 text-muted-foreground mx-1" />
          {DEPTH_OPTIONS.map((d) => (
            <button
              key={String(d.level)}
              type="button"
              onClick={() => ctrl.applyDepthFold(d.level)}
              className="px-1.5 py-0.5 rounded-full vk-text-2xs font-medium text-muted-foreground hover:text-foreground hover:bg-background/80 transition-colors"
              title={d.level === 'all' ? 'Buka Semua Kedalaman' : `Tampilkan hingga kedalaman ${d.level}`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={ctrl.fitView}
          className="rounded-full"
          aria-label="Fit View"
          title="Fit View"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={ctrl.centerRoot}
          className="rounded-full"
          aria-label="Pusatkan Akar"
          title="Pusatkan Akar"
        >
          <LocateFixed className="h-3.5 w-3.5" />
        </Button>

        {onToggleInspector && (
          <Button
            type="button"
            variant={isInspectorOpen ? 'secondary' : 'ghost'}
            size="sm"
            onClick={onToggleInspector}
            className="h-7 px-2.5 rounded-full gap-1 vk-text-xs"
            aria-label="Smart Inspector"
            aria-pressed={isInspectorOpen}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Inspector</span>
          </Button>
        )}
      </div>
    </div>
  );
}
