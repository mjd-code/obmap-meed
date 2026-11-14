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
import { ScrollArea } from "@/global/ui/scroll-area";
import { Progress } from "@/global/ui/progress";
import { ClaimUsernameModal } from "@/domains/settings/components/SettingsClaimUsernameModal";
import {
  Folder,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCw,
  Globe,
  ExternalLink,
  UploadCloud,
} from "lucide-react";
import {
  useCollabBulkPublishController,
  type BulkPublishModalProps,
} from "@/domains/collaboration/shared/hooks/useCollabBulkPublishController";

export type { BulkPublishModalProps };

/** Declarative modal view for bulk publishing a folder hierarchy and retrying failures. */
export const BulkPublishModal: React.FC<BulkPublishModalProps> = ({
  open,
  onOpenChange,
  folderNode,
  allNodes,
  currentVaultId,
  selectedNodeIds,
}) => {
  const controller = useCollabBulkPublishController({
    open,
    onOpenChange,
    folderNode,
    allNodes,
    currentVaultId,
    selectedNodeIds,
  });

  const statusLabel = controller.isRunning
    ? "Sedang mempublikasikan..."
    : controller.allCompleted
      ? "Semua catatan berhasil dipublikasikan!"
      : controller.hasFailures
        ? "Beberapa catatan gagal dipublikasikan"
        : "Siap diterbitkan";

  return (
    <>
      <Dialog open={open} onOpenChange={controller.handleDialogOpenChange}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-xl max-h-[86vh] flex flex-col p-4 sm:p-6 gap-3.5 sm:gap-5 rounded-2xl bg-card text-foreground shadow-2xl border border-border/80 overflow-hidden">
          <DialogHeader className="space-y-1.5 pb-2 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Folder className="w-4 h-4 text-amber-500 fill-amber-500/20" />
              <span>Publikasi Subfolder: {folderNode?.name}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Menerbitkan seluruh catatan turunan ({controller.items.length} berkas) ke portal publik,
              memperbarui versi yang sudah ada, dan mengunggah gambar pendukung secara otomatis.
            </DialogDescription>
          </DialogHeader>

          {/* Progress Bar & Summary Pill */}
          <div className="space-y-2 bg-muted/30 border border-border/80 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{statusLabel}</span>
              <span className="font-mono font-semibold">
                {controller.progress.succeeded} / {controller.progress.total} Terbit (
                {controller.progress.percent}%)
              </span>
            </div>
            <Progress value={controller.progress.percent} className="h-2" />
          </div>

          {/* Warning Banner Bila Ada Catatan Gagal */}
          {controller.hasFailures && !controller.isRunning && (
            <div className="flex items-center gap-2 p-2.5 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                Beberapa catatan gagal dipublikasikan. Anda dapat menekan ikon{" "}
                <strong>Coba Lagi</strong> pada baris terkait atau menggunakan tombol di bawah.
              </div>
            </div>
          )}

          {/* Scrollable Note List dengan Inline Error & Retry */}
          <ScrollArea className="flex-1 min-h-[200px] max-h-[320px] border border-border rounded-lg p-2 bg-background/50">
            <div className="space-y-1.5">
              {controller.items.map((item) => (
                <div
                  key={item.nodeId}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted/40 transition-colors text-xs border border-border/30"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {item.type === "folder" ? (
                      <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    )}
                    <span className="truncate font-medium">{item.title}</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase">
                      {item.type}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === "bundling" && (
                      <span className="flex items-center gap-1 text-muted-foreground text-[11px]">
                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                        Bundling aset...
                      </span>
                    )}
                    {item.status === "publishing" && (
                      <span className="flex items-center gap-1 text-muted-foreground text-[11px]">
                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                        Menerbitkan...
                      </span>
                    )}
                    {item.status === "success" && (
                      <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[10px] gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Terbit
                      </Badge>
                    )}
                    {item.status === "failed" && (
                      <div className="flex items-center gap-1.5">
                        <Badge variant="destructive" className="text-[10px]">
                          Gagal
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => controller.handleRetrySingle(item.nodeId)}
                          className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          title="Coba lagi catatan ini"
                        >
                          <RotateCw className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {controller.items.length === 0 && (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Tidak ditemukan catatan teks (.md) di dalam folder ini.
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Modal Footer Actions */}
          <DialogFooter className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-border mt-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {controller.publicReaderUrl && (
                <a
                  href={controller.publicReaderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-1.5 text-primary"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Buka Web Reader</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </Button>
                </a>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="ghost"
                size="sm"
                disabled={controller.isRunning}
                onClick={() => onOpenChange(false)}
                className="text-xs"
              >
                {controller.allCompleted ? "Selesai" : "Tutup"}
              </Button>

              {controller.hasFailures && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={controller.isRunning}
                  onClick={controller.handleRetryAllFailed}
                  className="text-xs gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  <RotateCw
                    className={`w-3.5 h-3.5 ${controller.isRunning ? "animate-spin" : ""}`}
                  />
                  <span>Coba Lagi Yang Gagal</span>
                </Button>
              )}

              {!controller.allCompleted && (
                <Button
                  variant="default"
                  size="sm"
                  disabled={controller.isRunning || controller.items.length === 0}
                  onClick={controller.handleStartPublish}
                  className="text-xs gap-1.5 min-w-[130px]"
                >
                  {controller.isRunning ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>
                        {controller.hasSuccesses
                          ? "Lanjutkan Publikasi"
                          : "Mulai Publikasi"}
                      </span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Wajib Klaim Username jika akun belum punya username */}
      <ClaimUsernameModal
        open={controller.showClaimModal}
        onOpenChange={controller.setShowClaimModal}
        onSuccess={controller.handleClaimSuccess}
      />
    </>
  );
};
