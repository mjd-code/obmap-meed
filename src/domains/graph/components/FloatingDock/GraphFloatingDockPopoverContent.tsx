import {
  Focus,
  Link2,
  LocateFixed,
  Maximize2,
  RotateCcw,
  Settings,
  Sparkles,
  UnfoldVertical,
} from 'lucide-react';
import { Button } from '@/global/ui/button';
import { cn } from '@/global/utils';
import { FreeForceControls } from '@/domains/graph/components/GraphFreeForceControls';
import { GlobalTemplatesPanel } from '@/domains/graph/components/GraphGlobalTemplatesPanel';
import {
  DockAppearanceCluster,
  DockFilterCluster,
  DockLayoutCluster,
} from '@/domains/graph/components/FloatingDock/GraphFloatingDockPrimaryClusters';
import type {
  DockClusterId,
  GraphFloatingDockController,
} from '@/domains/graph/shared/hooks/useGraphFloatingDockController';

export interface GraphFloatingDockPopoverContentProps {
  cluster: DockClusterId;
  ctrl: GraphFloatingDockController;
}

/** Pure cluster-content dispatcher composing existing modular graph panels. */
export function GraphFloatingDockPopoverContent({ cluster, ctrl }: GraphFloatingDockPopoverContentProps) {
  if (cluster === 'layout') return <DockLayoutCluster ctrl={ctrl} />;
  if (cluster === 'filter') return <DockFilterCluster ctrl={ctrl} />;
  if (cluster === 'appearance') return <DockAppearanceCluster ctrl={ctrl} />;

  if (cluster === 'physics') {
    return (
      <div className="space-y-3">
        {ctrl.isDeterministic && (
          <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 space-y-2">
            <p className="vk-text-xs text-foreground leading-relaxed">
              Simulasi fisika dinonaktifkan pada layout deterministik agar koordinat node tetap presisi tanpa jitter.
            </p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => ctrl.actions.selectStructure('free-force')}
              className="w-full h-7 text-xs gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Aktifkan Free-Force
            </Button>
          </div>
        )}
        <div className={cn(ctrl.isDeterministic && 'opacity-50 pointer-events-none select-none')}>
          <FreeForceControls forces={ctrl.config.forces} onUpdate={ctrl.actions.updateForceConfig} />
        </div>
      </div>
    );
  }

  if (cluster === 'zoom') {
    const camActions: Array<{ label: string; aria: string; icon: typeof Maximize2; accent?: boolean; onClick: () => void }> = [
      { label: 'Fit View', aria: 'Fit View', icon: Maximize2, accent: true, onClick: () => ctrl.actions.smartZoom('fit') },
      { label: 'Focus Node', aria: 'Focus Selection', icon: Focus, accent: true, onClick: () => ctrl.actions.smartZoom('selection') },
      { label: 'Reset 100%', aria: 'Pusatkan Akar', icon: LocateFixed, onClick: () => ctrl.actions.smartZoom('reset') },
    ];
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-1.5">
          {camActions.map((act) => (
            <Button key={act.aria} type="button" variant="outline" size="sm" aria-label={act.aria} onClick={act.onClick} className="h-8 justify-start gap-2 text-xs">
              <act.icon className={cn('h-3.5 w-3.5', act.accent && 'text-primary')} />
              {act.label}
            </Button>
          ))}
          {(ctrl.collapsedCount > 0 || ctrl.focused) && (
            <Button type="button" variant="secondary" size="sm" onClick={ctrl.actions.expandAllAndClearFocus} className="h-8 justify-start gap-2 text-xs">
              <UnfoldVertical className="h-3.5 w-3.5 text-primary" />
              Expand All
            </Button>
          )}
        </div>
        <div className="rounded-xl border border-border/70 bg-card/60 p-2.5 space-y-1.5">
          <Button type="button" variant={ctrl.layoutArrangement === 'custom' ? 'secondary' : 'ghost'} size="sm" onClick={ctrl.actions.toggleArrangementMode} className="w-full h-8 justify-between text-xs">
            <span className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5" />Tata Letak Manual</span>
            <span className="vk-text-2xs font-mono text-muted-foreground">{ctrl.layoutArrangement === 'custom' ? 'Flex' : 'Strict'}</span>
          </Button>
          <Button type="button" variant={ctrl.showMindmapRelationships ? 'secondary' : 'ghost'} size="sm" aria-pressed={ctrl.showMindmapRelationships} onClick={ctrl.actions.toggleShowRelationships} className="w-full h-8 justify-between text-xs">
            <span className="flex items-center gap-2"><Link2 className="h-3.5 w-3.5" />Relasi [[Wikilinks]]</span>
            <span className="vk-text-2xs font-mono text-muted-foreground">{ctrl.showMindmapRelationships ? 'On' : 'Off'}</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1.5">
        <Button type="button" variant="outline" size="sm" onClick={ctrl.actions.resetConfig} className="h-8 gap-1.5 text-xs">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Default
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={ctrl.actions.openWorkspaceGraphSettings} className="h-8 gap-1.5 text-xs">
          <Settings className="h-3.5 w-3.5 text-primary" />
          Full Settings
        </Button>
      </div>
      <GlobalTemplatesPanel
        config={ctrl.config}
        layout={ctrl.layoutMode}
        orientation={ctrl.orientation}
        onLayoutChange={ctrl.actions.handleLayoutChange}
        onOrientationChange={ctrl.actions.handleOrientationChange}
        setConfig={ctrl.actions.setFullConfig}
        resetConfig={ctrl.actions.resetConfig}
      />
    </div>
  );
}
