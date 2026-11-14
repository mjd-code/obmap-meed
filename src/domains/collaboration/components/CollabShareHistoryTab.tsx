import React from "react";
import { TabsContent } from "@/global/ui/tabs";
import { Button } from "@/global/ui/button";
import { ScrollArea } from "@/global/ui/scroll-area";
import { Eye, RefreshCw, Loader2, RotateCcw } from "lucide-react";
import type {
  VcsCommit,
  LocalMicroRevision,
} from "@/domains/vcs/shared/utils/vcs.types";

interface CollabShareHistoryTabProps {
  historyTab: "cloud" | "local";
  onHistoryTabChange: (tab: "cloud" | "local") => void;
  cloudCommits: VcsCommit[];
  microRevisions: LocalMicroRevision[];
  isLoadingHistory: boolean;
  onRefreshHistory: () => void;
  onInspectCloudCommit: (commit: VcsCommit) => void;
  onRestoreCloudCommit: (commit: VcsCommit) => void;
  onInspectLocalRevision: (rev: LocalMicroRevision) => void;
  onRestoreLocalRevision: (rev: LocalMicroRevision) => void;
}

/** Declarative view for the History tab inside CollabDocumentSharePopover. */
export const CollabShareHistoryTab: React.FC<CollabShareHistoryTabProps> = ({
  historyTab,
  onHistoryTabChange,
  cloudCommits,
  microRevisions,
  isLoadingHistory,
  onRefreshHistory,
  onInspectCloudCommit,
  onRestoreCloudCommit,
  onInspectLocalRevision,
  onRestoreLocalRevision,
}) => {
  return (
    <TabsContent value="history" className="mt-2.5 space-y-2">
      {/* Sub-Switch: Cloud vs Lokal */}
      <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground pb-1 border-b border-border/30">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onHistoryTabChange("cloud")}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              historyTab === "cloud"
                ? "bg-primary/10 text-primary font-semibold"
                : "hover:text-foreground"
            }`}
          >
            Cloud ({cloudCommits.length})
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onHistoryTabChange("local")}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              historyTab === "local"
                ? "bg-primary/10 text-primary font-semibold"
                : "hover:text-foreground"
            }`}
          >
            Lokal ({microRevisions.length})
          </button>
        </div>
        <button
          type="button"
          onClick={onRefreshHistory}
          disabled={isLoadingHistory}
          className="hover:text-foreground p-0.5"
          title="Segarkan riwayat"
        >
          <RefreshCw
            className={`w-2.5 h-2.5 ${isLoadingHistory ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Area Daftar Riwayat Ber-Scroll Ringkas */}
      <ScrollArea className="h-44 pr-1">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-28 text-xs text-muted-foreground gap-1.5">
            <Loader2 className="w-3 h-3 animate-spin text-primary" />
            Memuat riwayat...
          </div>
        ) : historyTab === "cloud" ? (
          cloudCommits.length === 0 ? (
            <div className="text-center py-8 text-[11px] text-muted-foreground">
              Belum ada commit cloud pada branch ini.
            </div>
          ) : (
            <div className="space-y-1.5">
              {cloudCommits.map((c) => (
                <div
                  key={c.id}
                  className="p-1.5 rounded-md border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between gap-1.5 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[11px] text-foreground truncate">
                      {c.message}
                    </div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                      <span>{c.commitHash.substring(0, 6)}</span>
                      <span>•</span>
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onInspectCloudCommit(c)}
                      className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                      title="Bandingkan dengan editan saat ini"
                    >
                      <Eye className="w-2.5 h-2.5 mr-0.5" />
                      Diff
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRestoreCloudCommit(c)}
                      className="h-5 px-1.5 text-[10px] gap-0.5 border-border/60 hover:border-primary/50"
                      title="Pulihkan catatan ke versi ini"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      Pulihkan
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : microRevisions.length === 0 ? (
          <div className="text-center py-8 text-[11px] text-muted-foreground">
            Belum ada snapshot lokal tersimpan (retensi 6 hari).
          </div>
        ) : (
          <div className="space-y-1.5">
            {microRevisions.map((rev) => (
              <div
                key={rev.id}
                className="p-1.5 rounded-md border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-between gap-1.5 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[11px] text-foreground truncate">
                    Snapshot {new Date(rev.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(rev.timestamp).toLocaleDateString()} •{" "}
                    {rev.content.length} karakter
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onInspectLocalRevision(rev)}
                    className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    <Eye className="w-2.5 h-2.5 mr-0.5" />
                    Diff
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRestoreLocalRevision(rev)}
                    className="h-5 px-1.5 text-[10px] gap-0.5 border-border/60 hover:border-primary/50"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    Pulihkan
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </TabsContent>
  );
};
