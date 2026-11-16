import { BoxSelect, CheckSquare, GitBranch, Palette, RotateCcw, Sigma } from 'lucide-react';
import { Button } from '@/global/ui/button';
import { Label } from '@/global/ui/label';
import { Slider } from '@/global/ui/slider';
import { cn } from '@/global/utils';
import type {
  MindmapLayoutMode,
  NodeStyleOverride,
  TopicShape,
} from '@/domains/graph/shared/utils/graph.types';
import type {
  NodeFrontmatterMindmapPatch,
  NodeFrontmatterMindmapProps,
} from '@/domains/graph/shared/utils/frontmatterMindmapSync';

const SUBTREE_STRUCTURES: Array<{ value: '' | MindmapLayoutMode; label: string }> = [
  { value: '', label: 'Warisi Induk (Inherit)' },
  { value: 'mindmap', label: 'Mindmap (Seimbang)' },
  { value: 'org-chart', label: 'Org Chart' },
  { value: 'brace-map', label: 'Brace Map' },
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

interface GraphInspectorTopicSectionProps {
  nodeName: string;
  nodeType: string;
  seedPalette: string[];
  currentSubtreeOverride?: MindmapLayoutMode;
  currentNodeStyle?: NodeStyleOverride;
  currentBranchColor?: string;
  frontmatterProps: NodeFrontmatterMindmapProps;
  onSetStructure: (mode: MindmapLayoutMode | null) => void;
  onSetShape: (shape: TopicShape | null) => void;
  onApplyColor: (color: string, applyToBranch: boolean) => void;
  onResetStyle: () => void;
  onUpdateFrontmatter: (patch: NodeFrontmatterMindmapPatch) => void;
  onWrapBoundary: () => void;
  onCreateSummary: () => void;
}

export function GraphInspectorTopicSection({
  nodeName,
  nodeType,
  seedPalette,
  currentSubtreeOverride,
  currentNodeStyle,
  currentBranchColor,
  frontmatterProps,
  onSetStructure,
  onSetShape,
  onApplyColor,
  onResetStyle,
  onUpdateFrontmatter,
  onWrapBoundary,
  onCreateSummary,
}: GraphInspectorTopicSectionProps) {
  const activeShape = currentNodeStyle?.topicShape ?? frontmatterProps.topicShape;
  const activeColor = currentNodeStyle?.fillColor ?? currentBranchColor ?? frontmatterProps.branchColor;
  const isFile = nodeType === 'file';

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="vk-text-xs font-semibold text-foreground truncate" title={nodeName}>
          {nodeName}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onResetStyle}
          className="h-6 px-1.5 vk-text-2xs gap-1 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </Button>
      </div>

      {/* Subtree Structure */}
      <div className="space-y-1">
        <Label className="vk-text-2xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <GitBranch className="h-3 w-3" /> Struktur Cabang
        </Label>
        <select
          aria-label="Struktur Cabang Topik"
          value={currentSubtreeOverride ?? ''}
          onChange={(e) => onSetStructure((e.target.value || null) as MindmapLayoutMode | null)}
          className="w-full h-8 rounded-md border border-border bg-background px-2 vk-text-xs text-foreground"
        >
          {SUBTREE_STRUCTURES.map((opt) => (
            <option key={opt.label} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Topic Shape */}
      <div className="space-y-1.5">
        <Label className="vk-text-2xs uppercase tracking-wider text-muted-foreground">
          Bentuk Topik (8 TopicShape)
        </Label>
        <div className="grid grid-cols-4 gap-1">
          {TOPIC_SHAPES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onSetShape(activeShape === s.value ? null : s.value)}
              className={cn(
                'rounded border px-1 py-1 vk-text-2xs truncate transition-colors',
                activeShape === s.value
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

      {/* Branch / Topic Color */}
      <div className="space-y-1.5">
        <Label className="vk-text-2xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Palette className="h-3 w-3" /> Warna Cabang & Topik
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {seedPalette.map((color) => (
            <button
              key={color}
              type="button"
              onClick={(e) => onApplyColor(color, !e.altKey)}
              className={cn(
                'h-5 w-5 rounded-full border transition-transform hover:scale-110',
                activeColor === color ? 'ring-2 ring-ring ring-offset-1 border-foreground' : 'border-border/50',
              )}
              style={{ backgroundColor: color }}
              title="Klik: Terapkan ke Cabang (Alt+Klik: Topik ini saja)"
              aria-label={`Pilih warna ${color}`}
            />
          ))}
        </div>
      </div>

      {/* YAML XMind Attachments (Priority, Progress, Checkbox) */}
      {isFile && (
        <div className="space-y-2.5 pt-2 border-t border-border/50">
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
                    onUpdateFrontmatter({
                      priority: frontmatterProps.priority === level ? null : level,
                    })
                  }
                  className={cn(
                    'flex-1 h-6 rounded border vk-text-2xs font-mono transition-colors',
                    frontmatterProps.priority === level
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
              <span className="font-mono text-foreground">{frontmatterProps.progress ?? 0}%</span>
            </div>
            <Slider
              min={0}
              max={100}
              step={10}
              value={[frontmatterProps.progress ?? 0]}
              onValueChange={([v]) => onUpdateFrontmatter({ progress: v > 0 ? v : null })}
            />
          </div>

          <Button
            type="button"
            variant={frontmatterProps.checkbox === 'done' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() =>
              onUpdateFrontmatter({
                checkbox: frontmatterProps.checkbox === 'done' ? 'todo' : 'done',
              })
            }
            className="w-full h-7 justify-start gap-2 vk-text-xs"
          >
            <CheckSquare className="h-3.5 w-3.5 text-primary" />
            <span>
              Status Task: {frontmatterProps.checkbox === 'done' ? 'Selesai (done)' : 'Belum (todo)'}
            </span>
          </Button>
        </div>
      )}

      {/* Boundary & Summary quick wrap */}
      <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-border/50">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onWrapBoundary}
          className="h-7 gap-1 vk-text-xs"
        >
          <BoxSelect className="h-3.5 w-3.5" />
          + Boundary
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCreateSummary}
          className="h-7 gap-1 vk-text-xs"
        >
          <Sigma className="h-3.5 w-3.5" />
          + Summary
        </Button>
      </div>
    </div>
  );
}
