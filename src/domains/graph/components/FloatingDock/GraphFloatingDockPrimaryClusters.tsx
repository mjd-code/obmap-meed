import { FileCode2, GitBranch, Network, RotateCcw } from 'lucide-react';
import { Button } from '@/global/ui/button';
import { Switch } from '@/global/ui/switch';
import { cn } from '@/global/utils';
import type { SkeletonPresetId } from '@/domains/graph/shared/utils/graph.types';
import { mergeAtmosphereConfig } from '@/domains/graph/shared/utils/atmosphereConfig';
import { SearchPanel } from '@/domains/graph/components/GraphSearchPanel';
import { LayoutPanel } from '@/domains/graph/components/GraphLayoutPanel';
import { ColorEngineControls } from '@/domains/graph/components/GraphColorEngineControls';
import { AtmosphereControls } from '@/domains/graph/components/GraphAtmosphereControls';
import { AppearancePanel } from '@/domains/graph/components/GraphAppearancePanel';
import type {
  AppearanceSubTab,
  GraphFloatingDockController,
  QuickCanvasMode,
  QuickStructureValue,
} from '@/domains/graph/shared/hooks/useGraphFloatingDockController';

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

const APPEARANCE_TABS: Array<{ id: AppearanceSubTab; label: string }> = [
  { id: 'presets', label: 'Tema & Warna' },
  { id: 'atmosphere', label: 'Atmosfer' },
  { id: 'metrics', label: 'Node & Link' },
];

export function DockLayoutCluster({ ctrl }: { ctrl: GraphFloatingDockController }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-border/60 bg-muted/40 p-1">
        {MODE_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = ctrl.activeCanvasTab === opt.id;
          const disabled = opt.id === 'outline' && !ctrl.hasSelectedFileNote && !ctrl.isOutlineMode;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => ctrl.actions.switchCanvasTab(opt.id)}
              title={disabled ? 'Pilih catatan Markdown dahulu untuk Note AST' : `Mode ${opt.label}`}
              aria-pressed={isActive}
              className={cn(
                'inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 vk-text-xs font-medium transition-colors',
                isActive ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
                disabled && 'opacity-40 cursor-not-allowed',
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{opt.label}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="dock-global-structure" className="vk-text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          Struktur & Depth Cabang
        </label>
        <select
          id="dock-global-structure"
          aria-label="Struktur Graf Global"
          value={ctrl.currentStructure}
          onChange={(e) => ctrl.actions.selectStructure(e.target.value as QuickStructureValue)}
          className="h-8 w-full rounded-lg border border-border/60 bg-background/80 px-2.5 vk-text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {STRUCTURE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="grid grid-cols-4 gap-1 rounded-lg border border-border/50 bg-muted/30 p-1">
          {DEPTH_OPTIONS.map((d) => (
            <button
              key={String(d.level)}
              type="button"
              onClick={() => ctrl.actions.applyDepthFold(d.level)}
              className="rounded-md py-1 vk-text-xs font-medium text-muted-foreground hover:bg-background/80 hover:text-foreground transition-colors"
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <LayoutPanel
        compact
        canvasMode={ctrl.canvasMode}
        layout={ctrl.layoutMode}
        orientation={ctrl.orientation}
        onModeSwitch={ctrl.actions.handleModeSwitch}
        onLayoutChange={ctrl.actions.handleLayoutChange}
        onOrientationChange={ctrl.actions.handleOrientationChange}
      />
    </div>
  );
}

export function DockFilterCluster({ ctrl }: { ctrl: GraphFloatingDockController }) {
  const topo = ctrl.config.topology;
  const topoRows = [
    { key: 'showBacklinks' as const, label: 'Relasi Backlinks', checked: topo.showBacklinks },
    { key: 'showTags' as const, label: 'Tautan Tags', checked: topo.showTags },
    { key: 'showHierarchy' as const, label: 'Hierarki Folder', checked: topo.showHierarchy },
  ];
  return (
    <div className="space-y-3">
      <div className="[&>div]:md:grid-cols-1">
        <SearchPanel
          search={ctrl.search}
          onSearchChange={ctrl.onSearchChange ?? (() => {})}
          minDepth={ctrl.minDepth}
          maxDepth={ctrl.maxDepth}
          onMinDepthChange={ctrl.onMinDepthChange ?? (() => {})}
          onMaxDepthChange={ctrl.onMaxDepthChange ?? (() => {})}
          contentFilter={ctrl.contentFilter}
          onContentFilterChange={ctrl.onContentFilterChange ?? (() => {})}
          tagFilter={ctrl.tagFilter}
          onTagFilterChange={ctrl.onTagFilterChange ?? (() => {})}
        />
      </div>
      <div className="rounded-xl border border-border/70 bg-card/60 p-3 space-y-2">
        <span className="vk-text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Visibilitas Topologi</span>
        {topoRows.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <span className="vk-text-xs text-foreground">{item.label}</span>
            <Switch checked={item.checked} onCheckedChange={(val) => ctrl.actions.updateTopologyConfig({ [item.key]: val })} />
          </div>
        ))}
      </div>
      {ctrl.filterCount > 0 && (
        <Button type="button" variant="outline" size="sm" onClick={ctrl.actions.resetAllFilters} className="w-full h-8 text-xs gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Filter ({ctrl.filterCount})
        </Button>
      )}
    </div>
  );
}

export function DockAppearanceCluster({ ctrl }: { ctrl: GraphFloatingDockController }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-border/60 bg-muted/40 p-1">
        {APPEARANCE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => ctrl.setAppearanceSubTab(t.id)}
            className={cn(
              'rounded-md py-1.5 px-2 vk-text-xs font-medium transition-colors truncate',
              ctrl.appearanceSubTab === t.id ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {ctrl.appearanceSubTab === 'presets' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-border/70 bg-card/60 p-2.5 space-y-1.5">
            <span className="vk-text-2xs font-semibold uppercase tracking-wider text-muted-foreground px-0.5">Skeleton Preset</span>
            <div className="grid grid-cols-1 gap-1">
              {ctrl.skeletonList.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => ctrl.actions.applySkeletonPreset(preset.id as SkeletonPresetId)}
                  className={cn(
                    'flex items-center justify-between rounded-lg border px-2.5 py-1.5 vk-text-xs transition-colors',
                    ctrl.activeSkeleton.id === preset.id
                      ? 'border-primary bg-primary/10 text-foreground font-semibold'
                      : 'border-border/50 bg-background/50 text-muted-foreground hover:text-foreground',
                  )}
                >
                  <span className="truncate">{preset.label}</span>
                  <span className="flex items-center gap-0.5 shrink-0">
                    {preset.seedPalette.slice(0, 4).map((hex, i) => (
                      <span key={i} className="h-2.5 w-2.5 rounded-full border border-border/40" style={{ backgroundColor: hex }} />
                    ))}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <ColorEngineControls compact hierarchy={ctrl.config.hierarchy} nodeConfig={ctrl.config.nodes} onHierarchyUpdate={ctrl.actions.updateHierarchyConfig} onNodeConfigUpdate={ctrl.actions.updateNodeConfig} />
        </div>
      )}
      {ctrl.appearanceSubTab === 'atmosphere' && (
        <AtmosphereControls atmosphere={mergeAtmosphereConfig(ctrl.config.atmosphere)} linkConfig={ctrl.config.links} nodeConfig={ctrl.config.nodes} onAtmosphereUpdate={ctrl.actions.updateAtmosphereConfig} onLinkUpdate={ctrl.actions.updateLinkConfig} onNodeUpdate={ctrl.actions.updateNodeConfig} />
      )}
      {ctrl.appearanceSubTab === 'metrics' && (
        <AppearancePanel config={ctrl.config} updateNodeConfig={ctrl.actions.updateNodeConfig} updateTopologyConfig={ctrl.actions.updateTopologyConfig} updateTopologyStyle={ctrl.actions.updateTopologyStyle} updateHierarchyConfig={ctrl.actions.updateHierarchyConfig} updateLinkConfig={ctrl.actions.updateLinkConfig} />
      )}
    </div>
  );
}
