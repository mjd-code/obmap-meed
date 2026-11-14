import { cn } from '@/global/utils/cn';
import { Button } from '@/global/ui/button';
import { Settings2, X } from 'lucide-react';
import type { CanvasMode, LayoutMode, MindmapOrientation } from '@/domains/graph/shared/utils/graph.types';
import { useGraphWorkspaceControlsController } from '@/domains/graph/shared/hooks/useGraphWorkspaceControlsController';
import { GraphHorizontalToolbar } from '@/domains/graph/components/GraphHorizontalToolbar';
import {
  GRAPH_CONTROL_NAV_ITEMS,
  PANEL_TITLES,
  GraphSettingContent,
  type SettingGroup,
  type SmartZoomAction,
} from '@/domains/graph/components/GraphSettingContent';

export type { SettingGroup, SmartZoomAction };

export interface GraphWorkspaceControlsProps {
  layout: LayoutMode;
  canvasMode?: CanvasMode;
  onCanvasModeChange?: (mode: CanvasMode) => void;
  onLayoutChange: (layout: LayoutMode) => void;
  orientation: MindmapOrientation;
  onOrientationChange: (orientation: MindmapOrientation) => void;
  collapsedCount?: number;
  onExpandAll?: () => void;
  focused?: boolean;
  onClearFocus?: () => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  minDepth?: number;
  onMinDepthChange?: (value: number) => void;
  maxDepth?: number;
  onMaxDepthChange?: (value: number) => void;
  contentFilter?: string;
  onContentFilterChange?: (value: string) => void;
  tagFilter?: string;
  onTagFilterChange?: (value: string) => void;
  onSmartZoom?: (action: SmartZoomAction) => void;
  leafId?: string;
  className?: string;
}

const noopStr = () => {};
const noopNum = () => {};

/** Declarative view for Visual Engine controls supporting both Floating Gear and Horizontal Ribbon modes. */
export function GraphWorkspaceControls({
  leafId,
  canvasMode,
  onCanvasModeChange,
  layout,
  onLayoutChange,
  orientation,
  onOrientationChange,
  search = '',
  onSearchChange = noopStr,
  minDepth = 0,
  onMinDepthChange = noopNum,
  maxDepth = 10,
  onMaxDepthChange = noopNum,
  contentFilter = '',
  onContentFilterChange = noopStr,
  tagFilter = '',
  onTagFilterChange = noopStr,
  className,
}: GraphWorkspaceControlsProps) {
  const ctrl = useGraphWorkspaceControlsController({
    leafId,
    canvasMode,
    onCanvasModeChange,
    layout,
    onLayoutChange,
    orientation,
    onOrientationChange,
    search,
    minDepth,
    maxDepth,
    contentFilter,
    tagFilter,
  });

  const sharedContentProps = {
    config: ctrl.config,
    layout: ctrl.layoutMode,
    canvasMode: ctrl.canvasMode,
    orientation: ctrl.orientation,
    onCanvasModeChange: ctrl.actions.handleModeSwitch,
    onLayoutChange: ctrl.actions.handleLayoutChange,
    onOrientationChange: ctrl.actions.handleOrientationChange,
    search,
    onSearchChange,
    minDepth,
    onMinDepthChange,
    maxDepth,
    onMaxDepthChange,
    contentFilter,
    onContentFilterChange,
    tagFilter,
    onTagFilterChange,
    updateNodeConfig: ctrl.actions.updateNodeConfig,
    updateLinkConfig: ctrl.actions.updateLinkConfig,
    updateTopologyConfig: ctrl.actions.updateTopologyConfig,
    updateTopologyStyle: ctrl.actions.updateTopologyStyle,
    updateHierarchyConfig: ctrl.actions.updateHierarchyConfig,
    updateAtmosphereConfig: ctrl.actions.updateAtmosphereConfig,
    setConfig: ctrl.actions.setFullConfig,
    resetConfig: ctrl.actions.resetConfig,
  };

  if (ctrl.displayMode === 'horizontal_toolbar') {
    return (
      <GraphHorizontalToolbar
        isExpanded={ctrl.isRibbonExpanded}
        onToggleExpanded={ctrl.toggleRibbonExpanded}
        activeTab={ctrl.ribbonActiveTab}
        onTabChange={ctrl.setRibbonActiveTab}
        filterCount={ctrl.filterCount}
        {...sharedContentProps}
      />
    );
  }

  return (
    <div
      className={cn(
        'pointer-events-none absolute top-3 right-3 z-40 flex flex-col items-end gap-1.5 sm:top-4 sm:right-4',
        className,
      )}
    >
      <div className="pointer-events-auto flex items-center rounded-lg border border-border/60 bg-card/90 p-1 shadow-md shadow-black/25 backdrop-blur-md transition-all">
        {ctrl.isGearOpen && (
          <div className="mr-1 flex max-w-[calc(100vw-80px)] sm:max-w-[280px] items-center gap-1 overflow-x-auto overscroll-contain pr-1 border-r border-border/50 no-scrollbar animate-in fade-in-0 slide-in-from-right-2 duration-150">
            {GRAPH_CONTROL_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = ctrl.gearActivePanel === item.id;
              const hasActiveFilterBadge = item.badgeFilter && ctrl.filterCount > 0;

              return (
                <Button
                  key={item.id}
                  type="button"
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="icon"
                  className={cn(
                    'relative h-7 w-7 rounded-md shrink-0 transition-colors',
                    hasActiveFilterBadge && 'text-primary',
                  )}
                  onClick={() => ctrl.handleSelectGearPanel(item.id)}
                  aria-label={item.label}
                  title={item.label}
                >
                  <Icon className={cn('h-3.5 w-3.5', item.iconClassName)} />
                  {hasActiveFilterBadge && (
                    <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary ring-1 ring-background" />
                  )}
                </Button>
              );
            })}
          </div>
        )}

        <Button
          type="button"
          variant={ctrl.isGearOpen ? 'secondary' : 'ghost'}
          size="icon"
          className={cn(
            'relative h-7 w-7 rounded-md shrink-0 transition-transform duration-200',
            ctrl.isGearOpen && 'rotate-45',
          )}
          aria-label="Toggle Graph Settings Menu"
          title="Pengaturan Tampilan Graf"
          onClick={ctrl.handleToggleGear}
        >
          <Settings2 className="h-4 w-4 text-foreground/80 hover:text-foreground" />
        </Button>
      </div>

      {ctrl.isGearOpen && ctrl.gearActivePanel && (
        <section
          role="region"
          aria-label="Graph Control Settings Panel"
          className="pointer-events-auto w-[min(340px,calc(100vw-1.5rem))] max-h-[calc(100vh-6.5rem)] flex flex-col rounded-xl border border-border/70 bg-card/95 shadow-2xl backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150"
        >
          <div className="flex h-8 items-center justify-between border-b border-border/50 px-3 shrink-0">
            <span className="text-[11px] font-semibold text-foreground/90">
              {PANEL_TITLES[ctrl.gearActivePanel]}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 rounded p-0 text-muted-foreground hover:text-foreground"
              onClick={ctrl.closeGearPanel}
              aria-label="Tutup Panel"
              title="Tutup Panel"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 [scrollbar-width:thin]">
            <GraphSettingContent activePanel={ctrl.gearActivePanel} compact {...sharedContentProps} />
          </div>
        </section>
      )}
    </div>
  );
}