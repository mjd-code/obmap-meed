import React, { useEffect, useState } from 'react';
import { 
  runModulePreloader, 
  preloadRegistry, 
  PreloadProgressState, 
  ModuleCategory 
} from '@/app/preloader/modulePreloader';
import { Badge } from '@/global/ui/badge';
import { ScrollArea } from '@/global/ui/scroll-area';
import { Button } from '@/global/ui/button';
import { 
  CheckCircle2, 
  Clock, 
  HardDrive, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Sliders, 
  Layers,
  Cpu
} from 'lucide-react';
import { getBrandConfig, useBrandConfig } from '@/global/config/brand.config';

const CATEGORY_COLORS: Record<ModuleCategory, string> = {
  system: 'bg-success/10 text-success border-success/20',
  shell: 'bg-info/10 text-info border-info/20',
  workspace: 'bg-primary/10 text-primary border-primary/20',
  editor: 'bg-warning/10 text-warning border-warning/20',
  graph: 'bg-accent/10 text-accent border-accent/20',
  settings: 'bg-danger/10 text-danger border-danger/20',
  plugin: 'bg-info/10 text-info border-info/20',
};

const STAGE_LABELS = {
  resolving: 'Mengunduh Modul...',
  evaluating: 'Mengevaluasi Modul...',
  warming: 'Memanaskan RAM Cache & Engine...',
  ready: 'Modul Siap Digunakan',
};

interface AppPreloaderScreenProps {
  onLoaded: () => void;
}

export const AppPreloaderScreen: React.FC<AppPreloaderScreenProps> = ({ onLoaded }) => {
  const brand = useBrandConfig();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [state, setState] = useState<PreloadProgressState>(() => ({
    currentIndex: 0,
    totalModules: preloadRegistry.getTotal(),
    currentModuleName: `Memulai ${getBrandConfig().name} Engine...`,
    currentMessage: 'Mempersiapkan lingkungan aplikasi...',
    currentCategory: 'system',
    currentStage: 'resolving',
    overallPercent: 0,
    currentModulePercent: 0,
    completed: [],
    slowestModule: null,
    heaviestModule: null,
    isComplete: false,
  }));

  useEffect(() => {
    let mounted = true;
    runModulePreloader((nextState) => {
      if (mounted) {
        setState(nextState);
        if (nextState.isComplete) {
          // Beri jeda 350ms agar visual 100% terlihat elegan sebelum transisi ke workspace
          setTimeout(() => {
            if (mounted) onLoaded();
          }, 350);
        }
      }
    });

    return () => {
      mounted = false;
    };
  }, [onLoaded]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl p-4 sm:p-6 md:p-8 select-none font-sans text-foreground overflow-y-auto">
      {/* Ambient background glow ring */}
      <div className="absolute h-64 w-64 sm:h-96 sm:w-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none -z-10" />

      {/* Main Container Card */}
      <div 
        className={`w-full transition-all duration-300 ease-in-out motion-reduce:transition-none flex flex-col rounded-3xl border border-border/80 bg-card/90 shadow-2xl backdrop-blur-2xl ${
          isExpanded ? 'max-w-2xl p-5 sm:p-7 gap-5' : 'max-w-md sm:max-w-lg p-6 sm:p-8 gap-6'
        }`}
      >
        {/* ================================================================= */}
        {/* 1. HEADER (Simple, Modern, Clean) */}
        {/* ================================================================= */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Pulsing Branded Icon */}
            <div className="relative flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 animate-pulse motion-reduce:animate-none" />
              <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping motion-reduce:animate-none opacity-25" />
            </div>

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                {brand.name}
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                {brand.tagline}
              </p>
            </div>
          </div>

          {/* Large Percent Badge */}
          <div className="flex flex-col items-end shrink-0">
            <span className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-primary font-mono">
              {state.overallPercent.toFixed(0)}%
            </span>
            <span className="vk-text-2xs sm:vk-text-xs text-muted-foreground font-mono">
              {state.currentIndex} / {state.totalModules} Modul
            </span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. PROGRESS BAR & ACTIVE STATUS */}
        {/* ================================================================= */}
        <div className="space-y-2.5">
          {/* Friendly Status Message */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-foreground truncate max-w-[85%]">
              {state.currentMessage}
            </span>
            <span className="text-muted-foreground font-mono vk-text-xs tabular-nums shrink-0">
              {state.overallPercent.toFixed(1)}%
            </span>
          </div>

          {/* Master Shimmer Progress Bar */}
          <div className="relative h-2.5 sm:h-3 w-full overflow-hidden rounded-full bg-secondary/80 p-0.5 border border-border/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-150 ease-out motion-reduce:transition-none relative overflow-hidden"
              style={{ width: `${state.overallPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite] motion-reduce:animate-none -skew-x-12" />
            </div>
          </div>

          <div className="flex items-center justify-between vk-text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 truncate">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping motion-reduce:animate-none" />
              <span className="truncate">{state.currentModuleName}</span>
            </span>
            <Badge variant="outline" className={`vk-text-2xs uppercase px-1.5 py-0 tracking-wider ${CATEGORY_COLORS[state.currentCategory]}`}>
              {state.currentCategory}
            </Badge>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 3. OPTIONAL EXPANDED DIAGNOSTICS VIEW */}
        {/* ================================================================= */}
        {isExpanded && (
          <div className="flex flex-col gap-4 pt-3 border-t border-border/60 animate-in fade-in-50 slide-in-from-top-2 duration-200 motion-reduce:animate-none">
            {/* Stage Detail & Sub-Progress */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 sm:p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-primary" />
                  {STAGE_LABELS[state.currentStage]}
                </span>
                <span className="font-mono vk-text-xs tabular-nums text-foreground">
                  {state.currentModulePercent}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary/80 transition-all duration-100 ease-linear motion-reduce:transition-none"
                  style={{ width: `${state.currentModulePercent}%` }}
                />
              </div>
            </div>

            {/* Performance Metrics: Latency & Size */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-xl border border-border/60 bg-background/60 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-warning" />
                  <span className="font-medium vk-text-xs">Modul Terlama (Latency)</span>
                </div>
                <p className="font-semibold text-foreground truncate text-xs">
                  {state.slowestModule ? state.slowestModule.name : '—'}
                </p>
                <p className="vk-text-xs text-muted-foreground font-mono">
                  {state.slowestModule ? `${state.slowestModule.durationMs} ms` : 'Mengukur...'}
                </p>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/60 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <HardDrive className="h-3.5 w-3.5 text-accent" />
                  <span className="font-medium vk-text-xs">Modul Terberat (Size)</span>
                </div>
                <p className="font-semibold text-foreground truncate text-xs">
                  {state.heaviestModule ? state.heaviestModule.name : '—'}
                </p>
                <p className="vk-text-xs text-muted-foreground font-mono">
                  {state.heaviestModule?.sizeKb ? `${state.heaviestModule.sizeKb} KB` : 'Mengukur...'}
                </p>
              </div>
            </div>

            {/* Loaded Modules Live Log */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between vk-text-xs text-muted-foreground font-medium uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" /> Riwayat Modul Terproses ({state.completed.length})
                </span>
              </div>
              <ScrollArea className="h-36 sm:h-40 w-full rounded-xl border border-border/60 bg-background/40 p-2">
                <div className="space-y-1">
                  {state.completed.slice().reverse().map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between vk-text-xs py-1 px-2 rounded-lg hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                        <span className="truncate text-foreground font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 font-mono text-muted-foreground vk-text-2xs">
                        {item.sizeKb ? <span>{item.sizeKb} KB</span> : null}
                        <span className="text-foreground font-semibold">{item.durationMs} ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* 4. FOOTER CONTROLS (Toggle Mode Diagnostik) */}
        {/* ================================================================= */}
        <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
          <span className="vk-text-xs text-muted-foreground">
            {state.isComplete ? 'Memasuki Workspace...' : 'Mempersiapkan memori RAM...'}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/60 flex items-center gap-1.5 rounded-lg"
          >
            <Sliders className="h-3.5 w-3.5 text-primary" />
            <span>{isExpanded ? 'Tutup Detail' : 'Lihat Detail'}</span>
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};