import { cn } from '@/global/utils/cn';
import { Button } from '@/global/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/global/ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/global/ui/tabs';
import { Settings2, Network, Palette, Sparkles, X } from 'lucide-react';
import type { CanvasMode, LayoutMode, MindmapOrientation } from '@/domains/graph/shared/utils/graph.types';
import { useGraphWorkspaceControlsController } from '@/domains/graph/shared/hooks/useGraphWorkspaceControlsController';
import { LayoutPanel } from '@/domains/graph/components/GraphLayoutPanel';
import { ColorEngineControls } from '@/domains/graph/components/GraphColorEngineControls';
import { AtmosphereControls } from '@/domains/graph/components/GraphAtmosphereControls';
import { AppearancePanel } from '@/domains/graph/components/GraphAppearancePanel';

export interface GraphWorkspaceControlsProps {
  layout?: LayoutMode;
  canvasMode?: CanvasMode;
  onCanvasModeChange?: (mode: CanvasMode) => void;
  onLayoutChange?: (layout: LayoutMode) => void;
  orientation?: MindmapOrientation;
  onOrientationChange?: (orientation: MindmapOrientation) => void;
  leafId?: string;
  className?: string;
  [key: string]: any; // Menerima filter & smartZoom yang diteruskan dari Orchestrator
}

export function GraphWorkspaceControls({
  leafId,
  canvasMode,
  onCanvasModeChange,
  layout,
  onLayoutChange,
  orientation,
  onOrientationChange,
  className,
}: GraphWorkspaceControlsProps) {
  const {
    isOpen,
    setIsOpen,
    activeTab,
    setActiveTab,
    canvasMode: currentCanvasMode,
    layoutMode: currentLayoutMode,
    orientation: currentOrientation,
    config,
    actions,
  } = useGraphWorkspaceControlsController({
    leafId,
    canvasMode,
    onCanvasModeChange,
    layout,
    onLayoutChange,
    orientation,
    onOrientationChange,
  });

  return (
    <div className={cn('absolute top-4 right-4 z-30 pointer-events-none select-none', className)}>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant={isOpen ? 'secondary' : 'outline'}
              className="pointer-events-auto shadow-md backdrop-blur-md bg-background/80 hover:bg-accent border-border"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Visual Engine Settings</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isOpen && (
        <div className="pointer-events-auto mt-2 w-84 max-h-[82vh] overflow-y-auto rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl p-3 flex flex-col gap-3 transition-all animate-in fade-in slide-in-from-top-2">
          <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
            <TabsList className="grid grid-cols-4 w-full h-8 p-1 bg-muted/60">
              <TabsTrigger value="layout" className="text-xs gap-1">
                <Network className="h-3.5 w-3.5" />
              </TabsTrigger>
              <TabsTrigger value="color" className="text-xs gap-1">
                <Palette className="h-3.5 w-3.5" />
              </TabsTrigger>
              <TabsTrigger value="atmosphere" className="text-xs gap-1">
                <Sparkles className="h-3.5 w-3.5" />
              </TabsTrigger>
              <TabsTrigger value="appearance" className="text-xs gap-1">
                <Settings2 className="h-3.5 w-3.5" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="layout" className="mt-3">
              <LayoutPanel
                canvasMode={currentCanvasMode}
                layout={currentLayoutMode}
                orientation={currentOrientation}
                onModeSwitch={actions.handleModeSwitch}
                onLayoutChange={actions.handleLayoutChange}
                onOrientationChange={actions.handleOrientationChange}
              />
            </TabsContent>

            <TabsContent value="color" className="mt-3">
              <ColorEngineControls
                hierarchy={config.hierarchy}
                nodeConfig={config.nodes}
                onHierarchyUpdate={actions.updateHierarchyConfig}
                onNodeConfigUpdate={actions.updateNodeConfig}
              />
            </TabsContent>

            <TabsContent value="atmosphere" className="mt-3">
              <AtmosphereControls
                atmosphere={config.atmosphere}
                linkConfig={config.links}
                nodeConfig={config.nodes}
                onAtmosphereUpdate={actions.updateAtmosphereConfig}
                onLinkUpdate={actions.updateLinkConfig}
                onNodeUpdate={actions.updateNodeConfig}
              />
            </TabsContent>

            <TabsContent value="appearance" className="mt-3">
              <AppearancePanel
                config={config}
                updateNodeConfig={actions.updateNodeConfig}
                updateTopologyConfig={actions.updateTopologyConfig}
                updateTopologyStyle={actions.updateTopologyStyle}
                updateHierarchyConfig={actions.updateHierarchyConfig}
                updateLinkConfig={actions.updateLinkConfig}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}