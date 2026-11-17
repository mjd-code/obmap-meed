import {
  Cpu,
  Filter,
  Maximize2,
  MoreHorizontal,
  Palette,
  SlidersHorizontal,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/global/ui/button';
import { cn } from '@/global/utils';
import {
  useGraphFloatingDockController,
  type DockClusterId,
  type UseGraphFloatingDockParams,
} from '@/domains/graph/shared/hooks/useGraphFloatingDockController';
import { GraphFloatingDockPopoverContent } from '@/domains/graph/components/FloatingDock/GraphFloatingDockPopoverContent';

export interface GraphFloatingDockProps extends UseGraphFloatingDockParams {
  className?: string;
}

interface DockClusterMeta {
  id: DockClusterId;
  label: string;
  title: string;
  icon: LucideIcon;
  widthClass: string;
}

const CLUSTER_ITEMS: DockClusterMeta[] = [
  { id: 'layout', label: 'Mode & Layout', title: 'Mode & Layout', icon: SlidersHorizontal, widthClass: 'max-w-[356px]' },
  { id: 'filter', label: 'Search & Filters', title: 'Pencarian & Filter', icon: Filter, widthClass: 'max-w-[348px]' },
  { id: 'appearance', label: 'Appearance & Living Canvas', title: 'Tampilan & Atmosfer', icon: Palette, widthClass: 'max-w-[368px]' },
  { id: 'physics', label: 'Engine & Physics', title: 'Fisika & Gaya', icon: Cpu, widthClass: 'max-w-[336px]' },
  { id: 'zoom', label: 'Smart Zoom & Camera', title: 'Kamera & Zoom', icon: Maximize2, widthClass: 'max-w-[312px]' },
  { id: 'more', label: 'Templates & Settings', title: 'Template & Pengaturan', icon: MoreHorizontal, widthClass: 'max-w-[340px]' },
];

/**
 * Unified Top-Center Space-Minimal Floating Dock for Graph Canvas.
 * Harmonizes visually with GraphCanvasUtilityDock and hosts a Centered Mega-Menu Card.
 */
export function GraphFloatingDock({ className, ...controllerParams }: GraphFloatingDockProps) {
  const ctrl = useGraphFloatingDockController(controllerParams);
  const activeMeta = CLUSTER_ITEMS.find((item) => item.id === ctrl.activeCluster) ?? null;

  return (
    <div
      ref={ctrl.dockRootRef}
      className={cn(
        'pointer-events-none absolute inset-x-0 top-3 bottom-3 z-40 flex flex-col items-center px-3',
        className,
      )}
    >
      {/* 1. Unified Compact Pill */}
      <div
        role="toolbar"
        aria-label="Graph Floating Dock"
        className="pointer-events-auto inline-flex max-w-full items-center gap-1 overflow-x-auto no-scrollbar rounded-lg border border-border/70 bg-card/90 p-1 shadow-lg shadow-black/15 backdrop-blur-md shrink-0"
      >
        {CLUSTER_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          const isActive = ctrl.activeCluster === item.id;
          const showFilterBadge = item.id === 'filter' && ctrl.filterCount > 0;
          const isPhysicsMuted = item.id === 'physics' && ctrl.isDeterministic;

          return (
            <div key={item.id} className="flex items-center shrink-0">
              {(idx === 4 || idx === 5) && (
                <div className="h-4 w-px bg-border/60 mx-0.5 shrink-0" />
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={item.label}
                aria-expanded={isActive}
                title={item.title}
                onClick={() => ctrl.toggleCluster(item.id)}
                className={cn(
                  'relative h-7 w-7 rounded-md shrink-0 text-muted-foreground hover:text-foreground transition-colors',
                  isActive && 'bg-accent text-accent-foreground',
                  showFilterBadge && !isActive && 'text-primary',
                  isPhysicsMuted && !isActive && 'opacity-70',
                )}
              >
                <Icon className={cn('h-3.5 w-3.5', item.id === 'appearance' && 'text-primary')} />
                {showFilterBadge && (
                  <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary ring-1 ring-background" />
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {/* 2. Centered Mega-Menu Card */}
      {activeMeta && ctrl.activeCluster && (
        <section
          role="region"
          aria-label="Graph Dock Cluster Panel"
          className={cn(
            'pointer-events-auto mt-2 w-full min-h-0 max-h-[calc(100%-3.5rem)] flex flex-col',
            activeMeta.widthClass,
            'rounded-xl border border-border/80 bg-popover/95 shadow-2xl shadow-black/25 backdrop-blur-md',
            'transition-[max-width] duration-200 ease-out animate-in fade-in-0 zoom-in-95 motion-reduce:animate-none',
          )}
        >
          <div className="flex h-8 items-center justify-between border-b border-border/50 px-3 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <activeMeta.icon className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="vk-text-xs font-semibold text-foreground truncate">{activeMeta.title}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Tutup Panel Dock"
              title="Tutup (Esc)"
              onClick={() => ctrl.setActiveCluster(null)}
              className="h-5 w-5 rounded-md p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
            <GraphFloatingDockPopoverContent cluster={ctrl.activeCluster} ctrl={ctrl} />
          </div>
        </section>
      )}
    </div>
  );
}
