import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/global/ui/dialog";
import { Button } from "@/global/ui/button";
import { Badge } from "@/global/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/global/ui/tabs";
import {
  GitMerge,
  Check,
  CheckCircle2,
  ArrowRight,
  Split,
  FileCode2,
  Link2Off,
  RefreshCw,
  GitBranch,
} from "lucide-react";
import { VcsMergeResolverContent } from "@/domains/vcs/components/VcsMergeResolverContent";
import { useVcsInteractiveMergeController } from "@/domains/vcs/shared/hooks/useVcsInteractiveMergeController";

export interface VcsInteractiveMergeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaultId: string;
  sourceBranch: string;
  targetBranch: string;
  targetNoteId?: string;
  targetNoteTitle?: string;
  baseContent?: string;
  currentContent?: string;
  incomingContent?: string;
  userId?: string;
  onMergeSuccess?: (resolvedContent: string, commitHash: string) => void;
}

/**
 * Pure declarative dialog shell for interactive 3-way merge conflict resolution
 * and graph-link verification.
 */
export const VcsInteractiveMergeModal: React.FC<VcsInteractiveMergeModalProps> = ({
  open,
  onOpenChange,
  vaultId,
  sourceBranch,
  targetBranch,
  targetNoteId = "global-merge",
  targetNoteTitle = "Resolusi Konflik Merge",
  baseContent: _baseContent = "",
  currentContent = "",
  incomingContent = "",
  userId = "current-user",
  onMergeSuccess,
}) => {
  const {
    activeTab,
    setActiveTab,
    isMerging,
    conflictStates,
    graphIssues,
    unresolvedCount,
    handleResolveHunk,
    handleExecuteMerge,
    handleKeepGraphLink,
    handleStripGraphLink,
  } = useVcsInteractiveMergeController({
    vaultId,
    sourceBranch,
    targetBranch,
    targetNoteId,
    targetNoteTitle,
    currentContent,
    incomingContent,
    userId,
    onOpenChange,
    onMergeSuccess,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[88vh] flex flex-col p-0 gap-0 border border-border/80 bg-background/95 backdrop-blur-xl shadow-2xl">
        <DialogHeader className="p-4 border-b border-border/60 flex-shrink-0 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Split className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold flex items-center gap-2">
                  Interactive 3-Way Merge Resolver
                  <Badge variant="outline" className="text-xs font-normal">
                    {targetNoteTitle}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-1 font-mono text-foreground font-medium">
                    <GitBranch className="w-3 h-3 text-muted-foreground" /> {sourceBranch}
                  </span>
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <span className="flex items-center gap-1 font-mono text-primary font-medium">
                    <GitBranch className="w-3 h-3 text-primary" /> {targetBranch}
                  </span>
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "resolver" | "graph-links")}
              >
                <TabsList className="h-8 bg-muted/60 p-0.5 border border-border/50">
                  <TabsTrigger value="resolver" className="text-xs h-7 px-3 gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5" />
                    Konflik
                    {unresolvedCount > 0 ? (
                      <Badge variant="destructive" className="h-4 px-1 text-[10px] ml-1">
                        {unresolvedCount}
                      </Badge>
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-1" />
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="graph-links" className="text-xs h-7 px-3 gap-1.5">
                    <Link2Off className="w-3.5 h-3.5 text-amber-500" />
                    Relasi Graf
                    {graphIssues.length > 0 && (
                      <Badge
                        variant="outline"
                        className="h-4 px-1 text-[10px] ml-1 border-amber-500/40 text-amber-500"
                      >
                        {graphIssues.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-4">
          <VcsMergeResolverContent
            activeTab={activeTab}
            sourceBranch={sourceBranch}
            targetBranch={targetBranch}
            conflictStates={conflictStates}
            graphIssues={graphIssues}
            onResolveHunk={handleResolveHunk}
            onKeepGraphLink={handleKeepGraphLink}
            onStripGraphLink={handleStripGraphLink}
          />
        </div>

        <DialogFooter className="p-3 border-t border-border/60 bg-muted/20 flex items-center justify-between sm:justify-between flex-shrink-0">
          <div className="text-xs text-muted-foreground font-mono">
            {unresolvedCount > 0 ? (
              <span className="text-amber-500 font-medium">
                ⚠️ {unresolvedCount} konflik tersisa
              </span>
            ) : (
              <span className="text-emerald-500 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Siap digabungkan
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5"
              disabled={unresolvedCount > 0 || isMerging}
              onClick={handleExecuteMerge}
            >
              {isMerging ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Menggabungkan...
                </>
              ) : (
                <>
                  <GitMerge className="w-3.5 h-3.5" />
                  Selesaikan & Gabungkan Commit
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
