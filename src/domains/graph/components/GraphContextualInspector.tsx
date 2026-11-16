import { useState } from 'react';
import { ChevronDown, Layers2, RotateCcw, Save, Sliders, Trash2, X } from 'lucide-react';
import { Button } from '@/global/ui/button';
import { Badge } from '@/global/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/global/ui/collapsible';
import { Slider } from '@/global/ui/slider';
import { Switch } from '@/global/ui/switch';
import { Label } from '@/global/ui/label';
import { cn } from '@/global/utils';
import type {
  BoundaryShape,
  BranchLineStyle,
  Node,
  SkeletonPresetId,
  SummaryBraceStyle,
} from '@/domains/graph/shared/utils/graph.types';
import { SKELETON_PRESETS } from '@/domains/graph/shared/utils/cascadingStyleResolver';
import { FreeForceControls } from '@/domains/graph/components/GraphFreeForceControls';
import { GraphInspectorTopicSection } from '@/domains/graph/components/GraphInspectorTopicSection';
import { useGraphContextualInspectorController } from '@/domains/graph/shared/hooks/useGraphContextualInspectorController';

export interface GraphContextualInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  activeOutlineNote?: Node | null;
  isOutlineMode?: boolean;
  isAuthenticated?: boolean;
  onUpdateOutlineContent?: (nextMarkdown: string) => void;
  className?: string;
}

const BRANCH_STYLES: Array<{ value: BranchLineStyle; label: string }> = [
  { value: 'tapered-bezier', label: 'Tapered Bezier (XMind)' },
  { value: 'cubic-bezier', label: 'Cubic Bezier' },
  { value: 'rounded-elbow', label: 'Rounded Elbow' },
  { value: 'orthogonal', label: 'Orthogonal' },
  { value: 'brace-bracket', label: 'Brace Bracket' },
  { value: 'straight', label: 'Straight' },
];

/**
 * Layer 2 + Layer 3 Contextual Smart Inspector (280px collapsible panel, <= 240 lines).
 * Switches scope automatically between Canvas, Selected Topic/Branch, and Boundaries/Summaries.
 */
export function GraphContextualInspector({
  isOpen,
  onClose,
  activeOutlineNote,
  isOutlineMode = false,
  isAuthenticated = false,
  onUpdateOutlineContent,
  className,
}: GraphContextualInspectorProps) {
  const [tuningOpen, setTuningOpen] = useState(false);
  const ctrl = useGraphContextualInspectorController({
    activeOutlineNote,
    isOutlineMode,
    isAuthenticated,
    onUpdateOutlineContent,
  });

  if (!isOpen) return null;

  const scopeLabel =
    ctrl.scope === 'topic' ? 'Topik & Cabang' : ctrl.scope === 'decoration' ? 'Boundary & Summary' : 'Kanvas Global';

  return (
    <aside
      aria-label="Smart Graph Inspector"
      className={cn(
        'pointer-events-auto absolute top-14 right-3 z-30 w-[280px] max-w-[calc(100vw-1.5rem)]',
        'max-h-[calc(100vh-6rem)] flex flex-col rounded-xl border border-border/70 bg-card/95 backdrop-blur-md shadow-2xl',
        'animate-in fade-in-0 slide-in-from-right-2 duration-150 motion-reduce:animate-none',
        className,
      )}
    >
      <div className="flex h-9 items-center justify-between border-b border-border/60 px-3 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sliders className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="vk-text-xs font-semibold text-foreground truncate">Inspector</span>
          <Badge variant="secondary" className="vk-text-2xs px-1.5 py-0 h-4 font-normal">
            {scopeLabel}
          </Badge>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Tutup Inspector"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 [scrollbar-width:thin]">
        {ctrl.selectedNode ? (
          <GraphInspectorTopicSection
            nodeName={ctrl.selectedNode.name}
            nodeType={ctrl.selectedNode.type}
            seedPalette={ctrl.activeSkeleton.seedPalette}
            currentSubtreeOverride={ctrl.currentSubtreeOverride}
            currentNodeStyle={ctrl.currentNodeStyle}
            currentBranchColor={ctrl.currentBranchColor}
            frontmatterProps={ctrl.frontmatterProps}
            onSetStructure={ctrl.actions.setSubtreeStructure}
            onSetShape={ctrl.actions.setTopicShape}
            onApplyColor={ctrl.actions.applyTopicColor}
            onResetStyle={ctrl.actions.resetSelectedStyle}
            onUpdateFrontmatter={ctrl.actions.updateFrontmatter}
            onWrapBoundary={() => ctrl.actions.wrapSelectedInBoundary('rounded')}
            onCreateSummary={() => ctrl.actions.createSummaryForSelected('curly')}
          />
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="vk-text-2xs uppercase tracking-wider text-muted-foreground">
                Skeleton Tema Kanvas
              </Label>
              <select
                aria-label="Skeleton Tema Kanvas"
                value={ctrl.activeSkeleton.id}
                onChange={(e) => ctrl.actions.setSkeletonPreset(e.target.value as SkeletonPresetId)}
                className="w-full h-8 rounded-md border border-border bg-background px-2 vk-text-xs text-foreground"
              >
                {Object.values(SKELETON_PRESETS).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="vk-text-2xs uppercase tracking-wider text-muted-foreground">
                Gaya Garis Cabang
              </Label>
              <select
                aria-label="Gaya Garis Cabang"
                value={ctrl.config.links.branchLineStyle ?? 'cubic-bezier'}
                onChange={(e) => ctrl.actions.updateLinkSetting({ branchLineStyle: e.target.value as BranchLineStyle })}
                className="w-full h-8 rounded-md border border-border bg-background px-2 vk-text-xs text-foreground"
              >
                {BRANCH_STYLES.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <Label className="vk-text-xs text-foreground">Tampilkan Markers (P1–P7)</Label>
                <Switch
                  checked={ctrl.config.nodes.showMarkers !== false}
                  onCheckedChange={(checked) => ctrl.actions.updateNodeSetting({ showMarkers: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="vk-text-xs text-foreground">Tampilkan Tag Pills</Label>
                <Switch
                  checked={ctrl.config.nodes.showTagPills !== false}
                  onCheckedChange={(checked) => ctrl.actions.updateNodeSetting({ showTagPills: checked })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Active Decorations Management (Boundary & Summary) */}
        {(ctrl.boundaries.length > 0 || ctrl.summaries.length > 0) && (
          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-center gap-1.5 vk-text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Layers2 className="h-3 w-3" /> Dekorasi Aktif ({ctrl.boundaries.length + ctrl.summaries.length})
            </div>
            {ctrl.boundaries.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-1.5 rounded-md border border-border/60 bg-background/60 px-2 py-1">
                <span className="vk-text-xs truncate flex-1">{b.title || 'Boundary'}</span>
                <select
                  aria-label={`Bentuk boundary ${b.title || b.id}`}
                  value={b.shape}
                  onChange={(e) => ctrl.actions.upsertBoundary({ ...b, shape: e.target.value as BoundaryShape })}
                  className="h-6 rounded border border-border bg-background px-1 vk-text-2xs"
                >
                  <option value="rounded">Rounded</option>
                  <option value="cloud">Cloud</option>
                  <option value="dashed">Dashed</option>
                </select>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => ctrl.actions.removeBoundary(b.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {ctrl.summaries.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-1.5 rounded-md border border-border/60 bg-background/60 px-2 py-1">
                <span className="vk-text-xs truncate flex-1">{s.label || 'Summary'}</span>
                <select
                  aria-label={`Kurung summary ${s.label || s.id}`}
                  value={s.braceStyle}
                  onChange={(e) => ctrl.actions.upsertSummary({ ...s, braceStyle: e.target.value as SummaryBraceStyle })}
                  className="h-6 rounded border border-border bg-background px-1 vk-text-2xs"
                >
                  <option value="curly">{'{} Curly'}</option>
                  <option value="square">[] Square</option>
                  <option value="round">() Round</option>
                </select>
                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => ctrl.actions.removeSummary(s.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Layer 3: Collapsible Engine & Physics Tuning */}
        <Collapsible open={tuningOpen} onOpenChange={setTuningOpen} className="pt-2 border-t border-border/60">
          <CollapsibleTrigger className="flex w-full items-center justify-between py-1 vk-text-xs font-semibold text-muted-foreground hover:text-foreground">
            <span>Engine & Physics Tuning</span>
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', tuningOpen && 'rotate-180')} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="space-y-1">
              <div className="flex justify-between vk-text-2xs text-muted-foreground">
                <span>Ukuran Font Label</span>
                <span className="font-mono text-foreground">{ctrl.config.nodes.labelSize}px</span>
              </div>
              <Slider
                min={10}
                max={20}
                step={1}
                value={[ctrl.config.nodes.labelSize]}
                onValueChange={([v]) => ctrl.actions.updateNodeSetting({ labelSize: v })}
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between vk-text-2xs text-muted-foreground">
                <span>Tebal Garis Cabang</span>
                <span className="font-mono text-foreground">{ctrl.config.links.width.toFixed(1)}px</span>
              </div>
              <Slider
                min={0.5}
                max={6}
                step={0.5}
                value={[ctrl.config.links.width]}
                onValueChange={([v]) => ctrl.actions.updateLinkSetting({ width: v })}
              />
            </div>

            {ctrl.layoutMode === 'free-force' && (
              <FreeForceControls forces={ctrl.config.forces} onUpdate={ctrl.actions.updateForceSetting} />
            )}

            <div className="flex items-center gap-1.5 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={ctrl.actions.applyLeafAsGlobalDefault} className="flex-1 h-7 vk-text-2xs gap-1">
                <Save className="h-3 w-3" />
                Default Global
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={ctrl.actions.resetLeafToDefault} className="h-7 px-2 vk-text-2xs gap-1">
                <RotateCcw className="h-3 w-3" />
                Reset
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </aside>
  );
}
