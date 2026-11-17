import { BoxSelect, CheckSquare, Palette, RotateCcw, Sigma, Trash2 } from 'lucide-react';
import { Button } from '@/global/ui/button';
import { Label } from '@/global/ui/label';
import { Slider } from '@/global/ui/slider';
import { cn } from '@/global/utils';
import type {
  BoundaryShape,
  CanvasMode,
  MindmapLayoutMode,
  SummaryBraceStyle,
  TopicShape,
} from '@/domains/graph/shared/utils/graph.types';
import {
  useGraphNodeContextStyleController,
  type UseGraphNodeContextStyleControllerParams,
} from '@/domains/graph/shared/hooks/useGraphNodeContextStyleController';

const SUBTREE_STRUCTURES: Array<{ value: '' | MindmapLayoutMode; label: string }> = [
  { value: '', label: 'Warisi Induk (Inherit)' },
  { value: 'mindmap', label: 'Mindmap (Seimbang)' },
  { value: 'org-chart', label: 'Org Chart (Atas-Bawah)' },
  { value: 'brace-map', label: 'Brace Map (Kiri-Kanan)' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'fishbone', label: 'Fishbone' },
];

const TOPIC_SHAPES: Array<{ value: TopicShape; label: string }> = [
  { value: 'rounded-rect', label: 'Rounded' },
  { value: 'pill', label: 'Pill' },
  { value: 'underline', label: 'Underline' },
  { value: 'ellipse', label: 'Ellipse' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'hexagon', label: 'Hexagon' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'parallelogram', label: 'Parallel' },
];

export interface GraphNodeContextStyleMenuProps extends UseGraphNodeContextStyleControllerParams {
  canvasMode: CanvasMode;
}

/**
 * Pure declarative Style & Format popover body for a selected graph node's Context Menu.
 */
export function GraphNodeContextStyleMenu({
  canvasMode,
  ...params
}: GraphNodeContextStyleMenuProps) {
  const ctrl = useGraphNodeContextStyleController(params);
  const { node } = params;
  const isFile = node.type === 'file';
  const isMindmap = canvasMode === 'mindmap';

  return (
    <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-0.5 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
      <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
        <span className="vk-text-xs font-semibold text-foreground truncate" title={node.name}>
          Style: {node.name}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={ctrl.resetStyle}
          className="h-6 px-1.5 vk-text-2xs gap-1 text-muted-foreground hover:text-foreground shrink-0"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      </div>

      {isMindmap && (
        <div className="space-y-1">
          <Label className="vk-text-2xs uppercase tracking-wider text-muted-foreground">
            Struktur Cabang
          </Label>
          <select
            aria-label="Struktur Cabang Node"
            value={ctrl.currentOverride ?? ''}
            onChange={(e) =>
              params.onSetStructure((e.target.value || null) as MindmapLayoutMode | null)
            }
            className="w-full h-7 rounded-md border border-border bg-background px-2 vk-text-xs text-foreground"
          >
            {SUBTREE_STRUCTURES.map((opt) => (
              <option key={opt.label} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="vk-text-2xs uppercase tracking-wider text-muted-foreground">
          Bentuk Topik (TopicShape)
        </Label>
        <div className="grid grid-cols-4 gap-1">
          {TOPIC_SHAPES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => ctrl.setTopicShape(ctrl.activeShape === s.value ? null : s.value)}
              className={cn(
                'rounded border px-1 py-1 vk-text-2xs truncate transition-colors',
                ctrl.activeShape === s.value
                  ? 'border-primary bg-primary/15 text-foreground font-semibold'
                  : 'border-border/60 bg-background/50 text-muted-foreground hover:text-foreground',
              )}
              title={s.label}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label className="vk-text-2xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Palette className="h-3 w-3" /> Warna
          </Label>
          <div className="inline-flex rounded border border-border/60 bg-muted/40 p-0.5">
            {(['branch', 'node'] as const).map((scope) => (
              <button
                key={scope}
                type="button"
                onClick={() => ctrl.setColorScope(scope)}
                className={cn(
                  'px-1.5 py-0.5 vk-text-2xs rounded transition-colors',
                  ctrl.colorScope === scope
                    ? 'bg-background text-foreground font-medium shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {scope === 'branch' ? 'Cabang' : 'Node Ini'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ctrl.activeSkeleton.seedPalette.map((color) => (
            <button
              key={color}
              type="button"
              onClick={(e) => ctrl.applyColor(color, e.altKey)}
              className={cn(
                'h-5 w-5 rounded-full border transition-transform hover:scale-110',
                ctrl.activeColor === color
                  ? 'ring-2 ring-ring ring-offset-1 border-foreground'
                  : 'border-border/50',
              )}
              style={{ backgroundColor: color }}
              title="Klik: Terapkan warna (Alt+Klik: Node ini saja)"
              aria-label={`Pilih warna ${color}`}
            />
          ))}
        </div>
      </div>

      {isFile && (
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="space-y-1">
            <Label className="vk-text-2xs uppercase tracking-wider text-muted-foreground">
              Prioritas YAML (P1–P7)
            </Label>
            <div className="flex items-center gap-1">
              {([1, 2, 3, 4, 5, 6, 7] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() =>
                    ctrl.updateFrontmatter({
                      priority: ctrl.frontmatterProps.priority === level ? null : level,
                    })
                  }
                  className={cn(
                    'flex-1 h-6 rounded border vk-text-2xs font-mono transition-colors',
                    ctrl.frontmatterProps.priority === level
                      ? 'border-primary bg-primary/20 text-foreground font-bold'
                      : 'border-border/60 text-muted-foreground hover:text-foreground',
                  )}
                >
                  P{level}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between vk-text-2xs text-muted-foreground">
              <span className="uppercase tracking-wider">Progres</span>
              <span className="font-mono text-foreground">{ctrl.frontmatterProps.progress ?? 0}%</span>
            </div>
            <Slider
              min={0}
              max={100}
              step={10}
              value={[ctrl.frontmatterProps.progress ?? 0]}
              onValueChange={([v]) => ctrl.updateFrontmatter({ progress: v > 0 ? v : null })}
            />
          </div>

          <Button
            type="button"
            variant={ctrl.frontmatterProps.checkbox === 'done' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() =>
              ctrl.updateFrontmatter({
                checkbox: ctrl.frontmatterProps.checkbox === 'done' ? 'todo' : 'done',
              })
            }
            className="w-full h-7 justify-start gap-2 vk-text-xs"
          >
            <CheckSquare className="h-3.5 w-3.5 text-primary" />
            <span>
              Status Task: {ctrl.frontmatterProps.checkbox === 'done' ? 'Selesai (done)' : 'Belum (todo)'}
            </span>
          </Button>
        </div>
      )}

      {isMindmap && (
        <div className="space-y-1.5 pt-2 border-t border-border/50">
          {ctrl.nodeBoundary ? (
            <div className="flex items-center justify-between gap-1.5 rounded-md border border-border/60 bg-background/60 px-2 py-1">
              <span className="vk-text-xs truncate flex-1">Boundary</span>
              <select
                aria-label="Bentuk boundary node"
                value={ctrl.nodeBoundary.shape}
                onChange={(e) => ctrl.updateBoundaryShape(e.target.value as BoundaryShape)}
                className="h-6 rounded border border-border bg-background px-1 vk-text-2xs"
              >
                <option value="rounded">Rounded</option>
                <option value="cloud">Cloud</option>
                <option value="dashed">Dashed</option>
              </select>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={ctrl.removeBoundary}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ) : null}

          {ctrl.nodeSummary ? (
            <div className="flex items-center justify-between gap-1.5 rounded-md border border-border/60 bg-background/60 px-2 py-1">
              <span className="vk-text-xs truncate flex-1">Summary</span>
              <select
                aria-label="Kurung summary node"
                value={ctrl.nodeSummary.braceStyle}
                onChange={(e) => ctrl.updateSummaryStyle(e.target.value as SummaryBraceStyle)}
                className="h-6 rounded border border-border bg-background px-1 vk-text-2xs"
              >
                <option value="curly">{'{} Curly'}</option>
                <option value="square">[] Square</option>
                <option value="round">() Round</option>
              </select>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={ctrl.removeSummary}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ) : null}

          {(!ctrl.nodeBoundary || (!ctrl.nodeSummary && node.parentId)) && (
            <div className="grid grid-cols-2 gap-1.5">
              {!ctrl.nodeBoundary && (
                <Button type="button" variant="outline" size="sm" onClick={ctrl.wrapBoundary} className="h-7 gap-1 vk-text-xs">
                  <BoxSelect className="h-3.5 w-3.5" />
                  + Boundary
                </Button>
              )}
              {!ctrl.nodeSummary && node.parentId && (
                <Button type="button" variant="outline" size="sm" onClick={ctrl.createSummary} className="h-7 gap-1 vk-text-xs">
                  <Sigma className="h-3.5 w-3.5" />
                  + Summary
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
