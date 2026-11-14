import React from "react";
import { TabsContent } from "@/global/ui/tabs";
import { Button } from "@/global/ui/button";
import { Badge } from "@/global/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/global/ui/tooltip";
import {
  Globe,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Send,
  CheckCircle,
  Clock,
  Lock,
  GlobeLock,
} from "lucide-react";
import type { NoteRecord } from "@/types/collaboration";

interface CollabSharePublishTabProps {
  noteRecord: NoteRecord | null;
  isPublished: boolean;
  isInReview: boolean;
  hasDiff: boolean;
  publicUrl: string;
  isCopied: boolean;
  processing: boolean;
  canPublish: boolean;
  isReadOnly: boolean;
  canEdit: boolean;
  onCopyLink: () => void;
  onOpenPublicUrl: () => void;
  onStartPublish: () => void;
  onUnpublish: () => void;
  onInspectPublishedDiff: () => void;
  onStartReview: () => void;
}

/** Declarative view for the Publish tab inside CollabDocumentSharePopover. */
export const CollabSharePublishTab: React.FC<CollabSharePublishTabProps> = ({
  noteRecord,
  isPublished,
  isInReview,
  hasDiff,
  publicUrl,
  isCopied,
  processing,
  canPublish,
  isReadOnly,
  canEdit,
  onCopyLink,
  onOpenPublicUrl,
  onStartPublish,
  onUnpublish,
  onInspectPublishedDiff,
  onStartReview,
}) => {
  return (
    <TabsContent value="publish" className="mt-2.5 space-y-2.5">
      {/* Status Header */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[11px] text-muted-foreground font-medium">
          Status Catatan:
        </span>
        {isPublished ? (
          <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[10px] px-1.5 py-0 font-medium gap-1">
            <CheckCircle className="w-2.5 h-2.5" />
            Terbit v{noteRecord?.version}
          </Badge>
        ) : isInReview ? (
          <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[10px] px-1.5 py-0 font-medium gap-1">
            <Clock className="w-2.5 h-2.5" />
            In Review
          </Badge>
        ) : (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 text-muted-foreground"
          >
            Draf Privat
          </Badge>
        )}
      </div>

      {/* Tampilan jika Terbit: Link + Tombol Perbarui & Unpublish Berdampingan */}
      {isPublished ? (
        <div className="space-y-2">
          {/* Link Sharing Box */}
          <div className="flex items-center gap-1 bg-muted/40 border border-border/50 rounded-md p-1 pl-2">
            <span className="text-[10px] text-muted-foreground truncate flex-1 font-mono">
              {publicUrl || "Memuat tautan..."}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCopyLink}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                >
                  {isCopied ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {isCopied ? "Tersalin!" : "Salin Tautan"}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenPublicUrl}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
                >
                  <ExternalLink className="w-3 h-3 text-primary" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Buka Web
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Tombol Berdampingan: Perbarui & Unpublish */}
          <div className="grid grid-cols-2 gap-1.5 pt-0.5">
            <Button
              size="sm"
              variant="secondary"
              onClick={onStartPublish}
              disabled={processing || !canPublish}
              className="h-7 text-xs font-medium gap-1"
              title="Perbarui versi di web"
            >
              <Globe className="w-3 h-3 text-primary shrink-0" />
              <span className="truncate">Perbarui</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onUnpublish}
              disabled={processing || !canPublish}
              className="h-7 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30 gap-1"
              title="Tarik catatan dari publikasi web (kembali ke draf privat)"
            >
              <GlobeLock className="w-3 h-3 shrink-0" />
              <span className="truncate">Unpublish</span>
            </Button>
          </div>

          {/* Indikator Diff jika ada modifikasi lokal yang belum di-publish */}
          {hasDiff && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onInspectPublishedDiff}
              className="w-full h-6 text-[10px] text-muted-foreground hover:text-foreground gap-1 justify-center border border-dashed border-border/50"
            >
              <Eye className="w-2.5 h-2.5 text-primary" />
              <span>Ada editan belum terbit • Cek Diff</span>
            </Button>
          )}
        </div>
      ) : (
        /* Jika Catatan Masih Draf */
        <div className="space-y-2 bg-muted/20 border border-border/40 rounded-lg p-2.5">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Catatan privat. Terbitkan agar dapat dibaca publik via URL resmi.
          </p>

          {canPublish ? (
            <Button
              size="sm"
              onClick={onStartPublish}
              disabled={processing}
              className="w-full h-7 text-xs font-medium gap-1.5"
            >
              <Globe className="w-3 h-3" />
              Publikasikan ke Web
            </Button>
          ) : !isReadOnly && canEdit && !isInReview ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onStartReview}
              disabled={processing}
              className="w-full h-7 text-xs font-medium gap-1.5"
            >
              <Send className="w-3 h-3 text-amber-500" />
              Ajukan Review ke Editor
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground py-1">
              <Lock className="w-3 h-3" />
              Hanya Editor/Admin yang dapat mempublikasikan
            </div>
          )}
        </div>
      )}
    </TabsContent>
  );
};
