import { useState } from "react";
import { cn } from "@/global/utils";
import { Ribbon } from "@/domains/workspace/components/WorkspaceRibbon";
import { WorkspaceRightSidebar } from "@/domains/workspace/components/WorkspaceRightSidebar";
import { StatusBar } from "@/domains/workspace/components/WorkspaceStatusBar";
import { WorkspaceTree } from "@/domains/workspace/components/WorkspaceTree";
import { WorkspaceGroup } from "@/domains/workspace/components/WorkspaceGroup";
import { useWorkspaceStore } from "@/domains/workspace/shared/stores/useWorkspaceStore";
import { useUIStore } from "@/global/stores";
import { useIsMobile } from "@/global/hooks/useMobile";
import { useVisualViewport } from "@/global/hooks/useVisualViewport";
import { PWAInstallPrompt } from "@/domains/sync/components/SyncPWAInstallPrompt";
import { useConfigSync } from "@/domains/settings/shared/api/configIndex";
import { AppPreloaderScreen } from "@/app/preloader/AppPreloaderScreen";
import { useVaultLifecycle } from "@/domains/workspace/shared/hooks/useVaultLifecycle";
import { VaultAccessDenied } from "@/domains/workspace/components/WorkspaceVaultAccessDenied";


function WorkspaceShell() {
  useVisualViewport();
  const { hydrated } = useConfigSync();
  const isMobile = useIsMobile();
  const root = useWorkspaceStore((s) => s.root);
  const activeGroup = useWorkspaceStore((s) => s.getActiveGroup());
  const activeTool = useUIStore((s) => s.activeTool);
  const rightSidebarOpen = useUIStore((s) => s.rightSidebarOpen);
  const isLeftOpen = activeTool === "files" || activeTool === "vcs";

  if (!hydrated) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="h-[100dvh] w-full flex flex-col overflow-hidden bg-background"
      style={{ height: "var(--vk-viewport-h, 100dvh)" }}
    >
      {/* 
        1. STATUS BAR:
        - Mobile & Tablet (< lg): Menjadi TOP BAR (order-1)
        - Desktop (>= lg): Menjadi BOTTOM BAR (lg:order-2)
      */}
      <div className="order-1 lg:order-2 shrink-0">
        <StatusBar />
      </div>

      {/* 
        2. KONTEN UTAMA WORKSPACE (Left Sidebar + Leaf / Tree + Right Sidebar):
        - Push / Slide-out sidebars di semua ukuran layar termasuk Mobile
      */}
      <div className="flex-1 min-h-0 flex order-2 lg:order-1 overflow-hidden relative">
        <Ribbon />
        <div
          className={cn(
            "flex-1 min-w-0 h-full min-h-0 transition-[margin] duration-200 ease-out",
            "max-md:w-full max-md:flex-none max-md:shrink-0",
            rightSidebarOpen && !isLeftOpen && "max-md:-ml-[min(250px,78vw)]",
          )}
        >
          {isMobile ? (
            activeGroup && <WorkspaceGroup group={activeGroup} isActive />
          ) : (
            <WorkspaceTree node={root} />
          )}
          <VaultAccessDenied />
        </div>
        <WorkspaceRightSidebar />
      </div>
    </div>
  );
}

export function WorkspaceRoot() {
  // Jalankan lifecycle vault murni Zustand
  useVaultLifecycle();

  // Flag preloaded untuk sesi aktif
  const [isPreloaded, setIsPreloaded] = useState(false);

  if (!isPreloaded) {
    return <AppPreloaderScreen onLoaded={() => setIsPreloaded(true)} />;
  }

  return (
    <>
      <WorkspaceShell />
      <PWAInstallPrompt variant="banner" showOfflineStatus />
    </>
  );
}