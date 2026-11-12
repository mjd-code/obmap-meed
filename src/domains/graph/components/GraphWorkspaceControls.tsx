import { cn } from '@/global/utils/cn';
import { Button } from '@/global/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/global/ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/global/ui/tabs';
import { Settings2, Network, Palette, Sparkles, X } from 'lucide-react';
import type { CanvasMode } from '@/domains/graph/shared/utils/graph.types';
import { useGraphWorkspaceControlsController } from '@/domains/graph/shared/hooks/useGraphWorkspaceControlsController';
import { LayoutPanel } from '@/domains/graph/components/GraphLayoutPanel';
import { ColorEngineControls } from '@/domains/graph/components/GraphColorEngineControls';
import { AtmosphereControls } from '@/domains/graph/components/GraphAtmosphereControls';
import { AppearancePanel } from '@/domains/graph/components/GraphAppearancePanel';

export interface GraphWorkspaceControlsProps {
  leafId?: string;
  onCanvasModeChange?: (mode: CanvasMode) => void;
  className?: string;
}

export function GraphWorkspaceControls({ leafId, onCanvasModeChange, className }: GraphWorkspaceControlsProps) {
  const {
    isOpen,
    setIsOpen,
    activeTab,
    setActiveTab,
    canvasMode,
    layoutMode,
    layoutArrangement,
    config,
    actions,
  } = useGraphWorkspaceControlsController({ leafId, onCanvasModeChange });

  return (
    <div className={cn('absolute top-4 right-4 z-30 pointer-events-none select-none', className)}>
      {/* Floating Gear Button (Trigger) */}
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

      {/* Expanded Settings Panel Drawer */}
      {isOpen && (
        <div className="pointer-events-auto mt-2 w-80 max-h-[82vh] overflow-y-auto rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl p-3 flex flex-col gap-3 transition-all animate-in fade-in slide-in-from-top-2">
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
                canvasMode={canvasMode}
                currentLayout={layoutMode}
                layoutArrangement={layoutArrangement}
                onCanvasModeChange={actions.handleModeSwitch}
                onSelectLayout={actions.setLayoutMode}
                onArrangementChange={actions.setLayoutArrangement}
              />
            </TabsContent>

            <TabsContent value="color" className="mt-3">
              <ColorEngineControls
                config={config}
                onUpdateHierarchyConfig={actions.updateHierarchyConfig}
                onUpdateNodeConfig={actions.updateNodeConfig}
              />
            </TabsContent>

            <TabsContent value="atmosphere" className="mt-3">
              <AtmosphereControls
                atmosphereConfig={config.atmosphere}
                onUpdateAtmosphere={actions.updateAtmosphereConfig}
              />
            </TabsContent>

            <TabsContent value="appearance" className="mt-3">
              <AppearancePanel
                config={config}
                onUpdateNodeConfig={actions.updateNodeConfig}
                onUpdateLinkConfig={actions.updateLinkConfig}
                onReset={actions.resetConfig}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}