import { useState, useRef, useEffect } from 'react';
import { cn } from '@/global/utils/cn';
import { Tabs, TabsList, TabsTrigger } from '@/global/ui/tabs';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react';
import {
  GRAPH_CONTROL_NAV_ITEMS,
  PANEL_TITLES,
  GraphSettingContent,
  type GraphSettingContentProps,
  type SettingGroup,
} from '@/domains/graph/components/GraphSettingContent';

export interface GraphHorizontalToolbarProps
  extends Omit<GraphSettingContentProps, 'activePanel'> {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  activeTab: SettingGroup;
  onTabChange: (tab: SettingGroup) => void;
  filterCount: number;
}

/** Resizable horizontal Office-style bottom ribbon toolbar for Graph Visual Engine controls. */
export function GraphHorizontalToolbar({
  isExpanded,
  onToggleExpanded,
  activeTab,
  onTabChange,
  filterCount,
  ...contentProps
}: GraphHorizontalToolbarProps) {
  const [toolbarHeight, setToolbarHeight] = useState<number>(340);
  const isDraggingRef = useRef<boolean>(false);
  const startYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(340);
  const tabsListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tabsListRef.current) return;
    const activeEl = tabsListRef.current.querySelector('[data-state="active"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }
  }, [activeTab, isExpanded]);

  const handleTabsWheel = (e: React.WheelEvent) => {
    if (!tabsListRef.current || e.deltaY === 0) return;
    tabsListRef.current.scrollLeft += e.deltaY;
  };

  const scrollTabs = (direction: 'left' | 'right') => {
    tabsListRef.current?.scrollBy({
      left: direction === 'left' ? -180 : 180,
      behavior: 'smooth',
    });
  };

  const handleStartResize = (clientY: number) => {
    isDraggingRef.current = true;
    startYRef.current = clientY;
    startHeightRef.current = toolbarHeight;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ns-resize';

    const onMove = (moveY: number) => {
      if (!isDraggingRef.current) return;
      const deltaY = startYRef.current - moveY;
      const maxHeight = window.innerHeight * 0.85;
      setToolbarHeight(Math.max(160, Math.min(maxHeight, startHeightRef.current + deltaY)));
    };

    const handleMouseMove = (e: MouseEvent) => onMove(e.clientY);
    const handleTouchMove = (e: TouchEvent) => onMove(e.touches[0].clientY);

    const handleEnd = () => {
      isDraggingRef.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleEnd);
  };

  return (
    <div className="pointer-events-auto absolute bottom-0 left-0 right-0 z-30 flex flex-col w-full select-none">
      {isExpanded && (
        <section
          aria-label="Graph Settings Ribbon"
          style={{ height: `${toolbarHeight}px` }}
          className="relative flex flex-col w-full border-t border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl animate-in fade-in-0 duration-150"
        >
          <div
            role="separator"
            aria-orientation="horizontal"
            onMouseDown={(e) => handleStartResize(e.clientY)}
            onTouchStart={(e) => handleStartResize(e.touches[0].clientY)}
            className="group absolute -top-1.5 left-0 right-0 h-3 cursor-ns-resize z-40 flex items-center justify-center transition-all"
            title="Tarik ke atas atau ke bawah untuk mengatur tinggi toolbar"
          >
            <div className="h-1 w-14 rounded-full bg-border/80 group-hover:bg-primary group-hover:h-1.5 transition-all" />
          </div>

          <div className="h-10 shrink-0 border-b border-border/60 bg-muted/40 px-3">
            <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-2">
              <div className="flex-1 min-w-0 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollTabs('left')}
                  className="h-6 w-6 shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Geser tab ke kiri"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>

                <Tabs
                  value={activeTab}
                  onValueChange={(val) => onTabChange(val as SettingGroup)}
                  className="h-full flex-1 min-w-0 flex items-center"
                >
                  <TabsList
                    ref={tabsListRef}
                    onWheel={handleTabsWheel}
                    className="h-7 w-full bg-muted/60 p-0.5 gap-0.5 overflow-x-auto flex items-center justify-start [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth"
                  >
                    {GRAPH_CONTROL_NAV_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const hasFilterBadge = item.badgeFilter && filterCount > 0;
                      return (
                        <TabsTrigger
                          key={item.id}
                          value={item.id}
                          className="h-6 px-2.5 text-[11px] font-medium data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs flex items-center gap-1.5 shrink-0 transition-colors"
                        >
                          <Icon className={cn('h-3 w-3', item.iconClassName)} />
                          <span>{item.label}</span>
                          {hasFilterBadge && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </Tabs>

                <button
                  type="button"
                  onClick={() => scrollTabs('right')}
                  className="h-6 w-6 shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Geser tab ke kanan"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={onToggleExpanded}
                className="group flex items-center gap-1.5 text-[11px] font-medium text-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded px-1.5 py-0.5 shrink-0 bg-transparent ml-2"
                aria-label="Tutup Toolbar"
              >
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span>Toolbar</span>
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4 [scrollbar-width:thin] [scrollbar-color:hsl(var(--muted-foreground)/0.2)_transparent]">
            <div className="mx-auto max-w-6xl w-full">
              <GraphSettingContent activePanel={activeTab} compact={false} {...contentProps} />
            </div>
          </div>
        </section>
      )}

      <div className="flex h-7 w-full items-center justify-between border-t border-border/60 bg-card/85 px-3 backdrop-blur-md transition-colors hover:bg-card/95">
        <button
          type="button"
          onClick={onToggleExpanded}
          className="group flex items-center gap-1.5 text-[11px] font-medium text-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded px-1.5 py-0.5 bg-transparent"
          aria-label={isExpanded ? 'Tutup toolbar' : 'Buka toolbar graph'}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
          <span>Toolbar</span>
          {filterCount > 0 && (
            <span className="flex items-center justify-center rounded-full bg-primary px-1.5 py-0.2 text-[9px] font-semibold text-primary-foreground">
              {filterCount}
            </span>
          )}
        </button>

        <span className="text-[10px] text-muted-foreground/70 hidden sm:inline">
          {isExpanded ? PANEL_TITLES[activeTab] : 'Klik toolbar untuk konfigurasi graph'}
        </span>
      </div>
    </div>
  );
}
