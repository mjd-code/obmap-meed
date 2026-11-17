import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/global/utils";
import { Button } from "@/global/ui/button";
import { useAuth } from "@/domains/auth/shared/hooks/useAuth";
import { devQuickLogin, isDevAuthEnabled } from "@/domains/auth/shared/api/devAuth";
import { useConfigSync } from "@/domains/settings/shared/hooks/useConfigSync";
import { useVaultLifecycle } from "@/domains/workspace/shared/hooks/useVaultLifecycle";
import { Ribbon } from "@/domains/workspace/components/WorkspaceRibbon";
import { WorkspaceRightSidebar } from "@/domains/workspace/components/WorkspaceRightSidebar";
import { StatusBar } from "@/domains/workspace/components/WorkspaceStatusBar";
import { WorkspaceTree } from "@/domains/workspace/components/WorkspaceTree";
import { WorkspaceGroup } from "@/domains/workspace/components/WorkspaceGroup";
import { useWorkspaceStore } from "@/domains/workspace/shared/stores/useWorkspaceStore";
import { useUIStore } from "@/global/stores";
import { useIsMobile } from "@/global/hooks/useMobile";

interface EditorLiveWorkbenchProps {
  onSwitchToSandbox: () => void;
}

export const EditorLiveWorkbench: React.FC<EditorLiveWorkbenchProps> = ({
  onSwitchToSandbox,
}) => {
  useVaultLifecycle();
  const { hydrated } = useConfigSync();
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();

  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const [attemptedAutoLogin, setAttemptedAutoLogin] = useState(false);

  const root = useWorkspaceStore((s) => s.root);
  const activeGroup = useWorkspaceStore((s) => s.getActiveGroup());
  const activeTool = useUIStore((s) => s.activeTool);
  const rightSidebarOpen = useUIStore((s) => s.rightSidebarOpen);
  const isLeftOpen = activeTool === "files" || activeTool === "vcs";

  useEffect(() => {
    const isManualLogout = sessionStorage.getItem("dev_manual_logout") === "true";
    if (!loading && !user && isDevAuthEnabled && !isManualLogout && !attemptedAutoLogin) {
      setIsAutoLoggingIn(true);
      setAttemptedAutoLogin(true);
      devQuickLogin()
        .catch((err) => console.warn("Prototype auto dev login skipped:", err))
        .finally(() => setIsAutoLoggingIn(false));
    }
  }, [loading, user, attemptedAutoLogin]);

  if (!hydrated || isAutoLoggingIn) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="vk-text-xs">Memuat Live Workbench...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-background">
      {!loading && !user && !isDevAuthEnabled && (
        <div className="h-9 shrink-0 border-b border-border bg-surface px-4 flex items-center justify-between gap-2 vk-text-xs">
          <span className="text-muted-foreground truncate">
            Mode lokal aktif · Masuk untuk menyinkronkan Cloud Vault.
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" className="h-6 vk-text-2xs" onClick={onSwitchToSandbox}>
              Gunakan Sandbox
            </Button>
            <Button asChild size="sm" className="h-6 vk-text-2xs">
              <Link to="/auth">Masuk</Link>
            </Button>
          </div>
        </div>
      )}

      <div className="order-1 lg:order-2 shrink-0">
        <StatusBar />
      </div>

      <div className="flex-1 min-h-0 flex order-2 lg:order-1 overflow-hidden relative">
        <Ribbon />
        <div
          className={cn(
            "flex-1 min-w-0 h-full min-h-0 transition-[margin] duration-200 ease-out",
            "max-md:w-full max-md:flex-none max-md:shrink-0",
            rightSidebarOpen && !isLeftOpen && "max-md:-ml-[min(250px,78vw)]"
          )}
        >
          {isMobile ? (
            activeGroup && <WorkspaceGroup group={activeGroup} isActive />
          ) : (
            <WorkspaceTree node={root} />
          )}
        </div>
        <WorkspaceRightSidebar />
      </div>
    </div>
  );
};
