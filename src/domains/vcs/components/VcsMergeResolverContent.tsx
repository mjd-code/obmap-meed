import React from "react";
import { Button } from "@/global/ui/button";
import { Badge } from "@/global/ui/badge";
import { ScrollArea } from "@/global/ui/scroll-area";
import { Alert, AlertTitle, AlertDescription } from "@/global/ui/alert";
import { AlertTriangle, Check, CheckCircle2, Link2Off } from "lucide-react";
import type {
  ConflictBlock,
  VcsGraphLinkIssue,
} from "@/domains/vcs/shared/hooks/useVcsInteractiveMergeController";

export interface VcsMergeResolverContentProps {
  activeTab: "resolver" | "graph-links";
  sourceBranch: string;
  targetBranch: string;
  conflictStates: Record<string, ConflictBlock>;
  graphIssues: VcsGraphLinkIssue[];
  onResolveHunk: (blockId: string, choice: "current" | "incoming" | "both") => void;
  onKeepGraphLink: (targetSlug: string) => void;
  onStripGraphLink: (targetSlug: string) => void;
}

/**
 * Pure declarative tab body for VcsInteractiveMergeModal: renders either line-level
 * conflict blocks or broken wiki-link graph warnings.
 */
export const VcsMergeResolverContent: React.FC<VcsMergeResolverContentProps> = ({
  activeTab,
  sourceBranch,
  targetBranch,
  conflictStates,
  graphIssues,
  onResolveHunk,
  onKeepGraphLink,
  onStripGraphLink,
}) => {
  if (activeTab === "resolver") {
    return (
      <div className="h-full flex flex-col gap-3">
        <div className="flex items-center justify-between px-3 py-2 bg-muted/40 rounded-md border border-border/50 text-xs">
          <span className="text-muted-foreground">
            Pilih versi untuk setiap blok perbedaan baris di bawah ini:
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-500 font-medium">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              Current (Cabang Aktif)
            </span>
            <span className="flex items-center gap-1 text-sky-500 font-medium">
              <div className="w-2 h-2 rounded-full bg-sky-500" />
              Incoming (Cabang Masuk)
            </span>
          </div>
        </div>

        <ScrollArea className="flex-1 border border-border/60 rounded-lg p-3 bg-muted/10">
          {Object.keys(conflictStates).length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/60" />
              <span>Tidak ada konflik sintaksis langsung. Konten dapat langsung digabungkan.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.values(conflictStates).map((block, idx) => (
                <div
                  key={block.id}
                  className={`rounded-lg border text-xs overflow-hidden transition-all ${
                    block.status === "unresolved"
                      ? "border-amber-500/60 bg-amber-500/5 shadow-sm"
                      : "border-border/60 bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between px-3 py-1.5 bg-muted/60 border-b border-border/40 font-mono text-[11px]">
                    <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                      Konflik #{idx + 1} (Baris {block.startLine})
                      {block.status === "unresolved" && (
                        <Badge variant="destructive" className="h-4 text-[9px] px-1">
                          Perlu Resolusi
                        </Badge>
                      )}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant={block.status === "accepted-current" ? "default" : "outline"}
                        className="h-6 px-2 text-[10px] gap-1"
                        onClick={() => onResolveHunk(block.id, "current")}
                      >
                        Ambil Current
                      </Button>
                      <Button
                        size="sm"
                        variant={block.status === "accepted-incoming" ? "default" : "outline"}
                        className="h-6 px-2 text-[10px] gap-1"
                        onClick={() => onResolveHunk(block.id, "incoming")}
                      >
                        Ambil Incoming
                      </Button>
                      <Button
                        size="sm"
                        variant={block.status === "accepted-both" ? "secondary" : "ghost"}
                        className="h-6 px-2 text-[10px]"
                        onClick={() => onResolveHunk(block.id, "both")}
                      >
                        Gabung Keduanya
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 divide-x divide-border/40 font-mono text-[11px]">
                    <div className="p-2.5 bg-emerald-500/5">
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mb-1 flex items-center justify-between">
                        <span>CURRENT ({targetBranch})</span>
                        {block.status === "accepted-current" && <Check className="w-3 h-3" />}
                      </div>
                      <pre className="whitespace-pre-wrap break-all text-foreground/90">
                        {block.currentLines.join("\n") || (
                          <span className="text-muted-foreground italic">(baris kosong)</span>
                        )}
                      </pre>
                    </div>

                    <div className="p-2.5 bg-sky-500/5">
                      <div className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold mb-1 flex items-center justify-between">
                        <span>INCOMING ({sourceBranch})</span>
                        {block.status === "accepted-incoming" && <Check className="w-3 h-3" />}
                      </div>
                      <pre className="whitespace-pre-wrap break-all text-foreground/90">
                        {block.incomingLines.join("\n") || (
                          <span className="text-muted-foreground italic">(baris kosong)</span>
                        )}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-3">
      <Alert className="border-amber-500/30 bg-amber-500/5 text-xs py-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <AlertTitle className="text-xs font-semibold text-amber-500">
          Graph-Awareness Conflict Prevention
        </AlertTitle>
        <AlertDescription className="text-muted-foreground text-[11px] mt-0.5">
          Sistem memindai referensi tautan internal wiki <code>[[slug]]</code> yang ada di cabang masuk.
        </AlertDescription>
      </Alert>

      <ScrollArea className="flex-1 border border-border/60 rounded-lg p-3 bg-muted/10">
        {graphIssues.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-xs gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/60" />
            <span>
              Seluruh tautan graf <code>[[slug]]</code> valid dan terhubung aman di kedua cabang.
            </span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {graphIssues.map((issue, idx) => (
              <div
                key={idx}
                className="p-3 rounded-md border border-border/60 bg-card flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 font-mono">
                  <Link2Off className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-destructive">[[{issue.targetSlug}]]</span>
                    <span className="text-muted-foreground text-[11px] ml-2">
                      di baris {issue.line}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onKeepGraphLink(issue.targetSlug)}
                  >
                    Biarkan Tautan
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 text-xs text-primary"
                    onClick={() => onStripGraphLink(issue.targetSlug)}
                  >
                    Lepas Kurung Siku
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
