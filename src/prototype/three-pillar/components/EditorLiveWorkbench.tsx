import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/domains/auth/shared/hooks/useAuth";
import { devQuickLogin, isDevAuthEnabled } from "@/domains/auth/shared/api/devAuth";
import { useConfigSync } from "@/domains/settings/shared/hooks/useConfigSync";
import { useVaultLifecycle } from "@/domains/workspace/shared/hooks/useVaultLifecycle";
import { StatusBar } from "@/domains/workspace/components/WorkspaceStatusBar";
import { useWorkspaceStore } from "@/domains/workspace/shared/stores/useWorkspaceStore";
import { useIsMobile } from "@/global/hooks/useMobile";
import { PrototypeWorkspaceCanvas } from "./PrototypeWorkspaceCanvas";
import type { PublishTabBindings } from "./EditorPublishStudioTab";
import { PrototypeWorkspaceDrawers } from "./PrototypeWorkspaceDrawers";

interface EditorLiveWorkbenchProps {
  publishProps: PublishTabBindings;
  onOpenPublishTab: () => void;
}

export const EditorLiveWorkbench: React.FC<EditorLiveWorkbenchProps> = ({
  publishProps,
  onOpenPublishTab,
}) => {
  useVaultLifecycle();
  const { hydrated } = useConfigSync();
  const { user, loading } = useAuth();
  const isMobile = useIsMobile();

  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const [attemptedAutoLogin, setAttemptedAutoLogin] = useState(false);

  const root = useWorkspaceStore((s) => s.root);
  const activeGroup = useWorkspaceStore((s) => s.getActiveGroup());

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
          <span className="vk-text-xs">Memuat Workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-background">
      {/* StatusBar: Top on Mobile (< lg, Double Header), Bottom on Desktop (>= lg) */}
      <div className="order-1 lg:order-2 shrink-0">
        <StatusBar />
      </div>

      {/* Center Canvas + Left Ribbon + Drawers with Isolated Stacking Context */}
      <div className="flex-1 min-h-0 flex order-2 lg:order-1 overflow-hidden relative">
        <PrototypeWorkspaceDrawers
          onOpenPublishTab={onOpenPublishTab}
          centerCanvas={
            isMobile ? (
              activeGroup && (
                <PrototypeWorkspaceCanvas node={activeGroup} publishProps={publishProps} />
              )
            ) : (
              <PrototypeWorkspaceCanvas node={root} publishProps={publishProps} />
            )
          }
        />
      </div>
    </div>
  );
};
