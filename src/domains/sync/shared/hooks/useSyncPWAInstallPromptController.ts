import { useState, useEffect } from "react";
import { usePWA } from "@/domains/sync/shared/hooks/usePWA";

export interface UseSyncPWAInstallPromptControllerParams {
  onDismiss?: () => void;
}

/**
 * Headless controller for SyncPWAInstallPrompt: persists 7-day prompt dismissal,
 * triggers native PWA install or iOS fallback instructions, and exposes online/update flags.
 */
export function useSyncPWAInstallPromptController({
  onDismiss,
}: UseSyncPWAInstallPromptControllerParams) {
  const {
    canInstall,
    isInstalled,
    isOnline,
    isUpdateAvailable,
    platform,
    installApp,
    updateApp,
    getInstallInstructions,
  } = usePWA();

  const [dismissed, setDismissed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Check localStorage for dismissal
  useEffect(() => {
    const dismissedUntil = localStorage.getItem("pwa-prompt-dismissed");
    if (dismissedUntil) {
      const dismissedDate = new Date(dismissedUntil);
      if (dismissedDate > new Date()) {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    // Dismiss for 7 days
    const dismissUntil = new Date();
    dismissUntil.setDate(dismissUntil.getDate() + 7);
    localStorage.setItem("pwa-prompt-dismissed", dismissUntil.toISOString());
    setDismissed(true);
    onDismiss?.();
  };

  const handleInstall = async () => {
    const result = await installApp();
    if (!result.success && (platform === "ios" || !canInstall)) {
      setShowInstructions(true);
    }
  };

  const instructions = getInstallInstructions();

  return {
    canInstall,
    isInstalled,
    isOnline,
    isUpdateAvailable,
    platform,
    updateApp,
    dismissed,
    showInstructions,
    setShowInstructions,
    instructions,
    handleDismiss,
    handleInstall,
  };
}
