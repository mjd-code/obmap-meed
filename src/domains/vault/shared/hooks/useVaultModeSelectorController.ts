import { useEffect, useState } from "react";
import { pickVaultFolder, supportsFolderPicker } from "@/domains/vault/shared/api/repositoryCapabilities";
import { VaultValidationService } from "@/domains/vault/shared/api/VaultValidationService";

export type VaultCreationKind = "folder" | "cloud";
export type VaultCreationStep = "kind" | "folder-action" | "name";

export interface UseVaultModeSelectorControllerParams {
  onOpenChange: (open: boolean) => void;
  onCreateFolderVault: (
    handle: FileSystemDirectoryHandle,
    name: string,
    cloudSync: boolean
  ) => Promise<string | null>;
  onOpenFolderVault: (handle: FileSystemDirectoryHandle) => Promise<string | null>;
  onCreateCloudVault: (name: string) => Promise<string | null>;
  onVaultCreated: (vaultId: string) => void;
}

/**
 * Headless controller for VaultModeSelector: manages wizard steps,
 * folder picker actions, cloud/folder vault creation, error formatting,
 * and debounced vault name availability checks.
 */
export function useVaultModeSelectorController({
  onOpenChange,
  onCreateFolderVault,
  onOpenFolderVault,
  onCreateCloudVault,
  onVaultCreated,
}: UseVaultModeSelectorControllerParams) {
  const [step, setStep] = useState<VaultCreationStep>("kind");
  const [kind, setKind] = useState<VaultCreationKind>("folder");
  const [vaultName, setVaultName] = useState("");
  const [cloudSync, setCloudSync] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nameAvailability, setNameAvailability] = useState<{
    status: "idle" | "checking" | "valid" | "duplicate";
    message?: string;
    slug?: string;
  }>({ status: "idle" });

  // Debounced check saat mengetik vaultName:
  useEffect(() => {
    const trimmed = vaultName.trim();
    if (!trimmed) {
      setNameAvailability({ status: "idle" });
      return;
    }

    setNameAvailability({ status: "checking" });
    const timer = setTimeout(async () => {
      const res = await VaultValidationService.checkAvailability({
        name: trimmed,
      });
      if (res.available) {
        setNameAvailability({ status: "valid", slug: res.slug });
      } else {
        setNameAvailability({
          status: "duplicate",
          slug: res.slug,
          message: res.reason,
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [vaultName]);

  const reset = () => {
    setStep("kind");
    setKind("folder");
    setVaultName("");
    setCloudSync(false);
    setBusy(false);
    setError(null);
  };

  const finish = (vaultId: string | null) => {
    if (!vaultId) return;
    onVaultCreated(vaultId);
    onOpenChange(false);
    reset();
  };

  const describeError = (err: unknown) => {
    if (err instanceof Error) {
      if (err.name === "AbortError") return null;
      if (err.name === "NotAllowedError") return "Permission to use that folder was denied.";
      return err.message;
    }
    return "Something went wrong.";
  };

  const handleOpenExisting = async () => {
    setError(null);
    setBusy(true);
    try {
      const handle = await pickVaultFolder();
      if (!handle) return;
      finish(await onOpenFolderVault(handle));
    } catch (err) {
      const message = describeError(err);
      if (message) setError(message);
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    if (!vaultName.trim()) {
      setError("Please enter a vault name");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      if (kind === "cloud") {
        finish(await onCreateCloudVault(vaultName.trim()));
      } else {
        const handle = await pickVaultFolder();
        if (!handle) return;
        finish(await onCreateFolderVault(handle, vaultName.trim(), cloudSync));
      }
    } catch (err) {
      const message = describeError(err);
      if (message) setError(message);
    } finally {
      setBusy(false);
    }
  };

  const handleDialogOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) reset();
  };

  const selectFolderMode = () => {
    setKind("folder");
    setStep("folder-action");
    setError(null);
  };

  const selectCloudMode = () => {
    setKind("cloud");
    setStep("name");
    setCloudSync(true);
    setError(null);
  };

  const selectCreateNewFolder = () => {
    setStep("name");
    setError(null);
  };

  return {
    step,
    setStep,
    kind,
    vaultName,
    setVaultName,
    cloudSync,
    setCloudSync,
    busy,
    error,
    nameAvailability,
    supportsFolders: supportsFolderPicker(),
    handleDialogOpenChange,
    selectFolderMode,
    selectCloudMode,
    selectCreateNewFolder,
    handleOpenExisting,
    handleCreate,
  };
}
