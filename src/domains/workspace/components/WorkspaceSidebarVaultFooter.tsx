import { Button } from "@/global/ui/button";
import {
  Check,
  ChevronsUpDown,
  Cloud,
  FolderOpen,
  Settings,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/global/ui/dropdown-menu";

interface VaultSummaryItem {
  id: string;
  name: string;
  location: "folder" | "cloud";
  nodeCount: number;
}

interface WorkspaceSidebarVaultFooterProps {
  vaultName: string | null;
  currentVaultId: string | null;
  availableVaults: VaultSummaryItem[];
  folderCount: number;
  fileCount: number;
  onSwitchVault: (vaultId: string) => void;
  onOpenSettings: () => void;
}

/** Declarative vault switcher and node stats footer for WorkspaceSidebarPanel. */
export function WorkspaceSidebarVaultFooter({
  vaultName,
  currentVaultId,
  availableVaults,
  folderCount,
  fileCount,
  onSwitchVault,
  onOpenSettings,
}: WorkspaceSidebarVaultFooterProps) {
  return (
    <div className="p-2 border-t border-sidebar-border bg-sidebar/50 shrink-0">
      <div className="flex items-center justify-between gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-8 min-w-0 flex-1 justify-start gap-2 px-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-left"
              aria-label="Switch vault"
            >
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm font-medium">
                {vaultName || "Select Vault"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {availableVaults.map((vault) => {
              const VaultIcon =
                vault.location === "folder" ? FolderOpen : Cloud;
              const active = vault.id === currentVaultId;
              return (
                <DropdownMenuItem
                  key={vault.id}
                  onSelect={() => onSwitchVault(vault.id)}
                  className="gap-2 py-2 cursor-pointer"
                >
                  <VaultIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{vault.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {vault.nodeCount} {vault.nodeCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                  {active && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-md transition-colors"
            title="Settings"
            aria-label="Open Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-1.5 px-2 text-[11px] text-muted-foreground">
        <span>
          {folderCount} {folderCount === 1 ? "folder" : "folders"}
        </span>
        <span>•</span>
        <span>
          {fileCount} {fileCount === 1 ? "file" : "files"}
        </span>
      </div>
    </div>
  );
}
