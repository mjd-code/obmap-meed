import React from "react";
import { CheckCircle2, Eye, EyeOff, PenTool, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/global/ui/avatar";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import { PROTOTYPE_SCHOLAR_PROFILE } from "../mockData";
import type { SimulatedRole } from "../types";

interface ProfileIdentityHeaderProps {
  role: SimulatedRole;
  effectiveVisitorView: boolean;
  isPreviewAsVisitor: boolean;
  onTogglePreviewAsVisitor: () => void;
  onOpenEditor: () => void;
}

export const ProfileIdentityHeader: React.FC<ProfileIdentityHeaderProps> = ({
  role,
  effectiveVisitorView,
  isPreviewAsVisitor,
  onTogglePreviewAsVisitor,
  onOpenEditor,
}) => {
  const scholar = PROTOTYPE_SCHOLAR_PROFILE;

  return (
    <>
      {isPreviewAsVisitor && role === "owner" && (
        <div className="rounded-xl border border-info/35 bg-info/10 px-4 py-2 flex items-center justify-between gap-3">
          <span className="vk-text-xs text-info font-medium inline-flex items-center gap-2">
            <Eye className="h-4 w-4 shrink-0" />
            Pratinjau Pengunjung Aktif — Tab & brankas privat disembunyikan.
          </span>
          <Button size="sm" variant="outline" className="h-7 rounded-full vk-text-xs shrink-0" onClick={onTogglePreviewAsVisitor}>
            Kembali ke Owner
          </Button>
        </div>
      )}

      <section className="rounded-2xl border border-border/80 bg-card p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar className="h-14 w-14 border border-primary/40 shrink-0">
              <AvatarFallback className="bg-primary/15 text-primary font-bold vk-text-base">
                {scholar.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="vk-text-lg font-bold tracking-tight truncate">{scholar.name}</h1>
                <Badge variant="info" className="vk-text-2xs gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Verified
                </Badge>
              </div>
              <p className="vk-text-xs font-mono text-primary">{scholar.handle} · ITB</p>
              <p className="vk-text-xs text-muted-foreground line-clamp-1">{scholar.bio}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {role !== "visitor" && (
              <Button
                variant={isPreviewAsVisitor ? "default" : "outline"}
                size="sm"
                className="h-8 rounded-full gap-1.5 vk-text-xs"
                onClick={onTogglePreviewAsVisitor}
              >
                {isPreviewAsVisitor ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {isPreviewAsVisitor ? "Exit Preview" : "Preview as Visitor"}
              </Button>
            )}
            {effectiveVisitorView ? (
              <Button size="sm" className="h-8 rounded-full vk-text-xs" onClick={() => toast.success(`Mengikuti ${scholar.handle}`)}>
                + Follow
              </Button>
            ) : (
              <Button size="sm" className="h-8 rounded-full gap-1.5 vk-text-xs" onClick={onOpenEditor}>
                <PenTool className="h-3.5 w-3.5" /> Buka Editor
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              aria-label="Bagikan Profil"
              onClick={() => toast.success(`URL /${scholar.handle} disalin`)}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 divide-x divide-border/60 pt-3 border-t border-border/60 text-center">
          <div className="px-2">
            <p className="vk-text-base font-bold">{scholar.stats.citations}</p>
            <p className="vk-text-2xs text-muted-foreground">Sitasi</p>
          </div>
          <div className="px-2">
            <p className="vk-text-base font-bold">{scholar.stats.publishedWorks}</p>
            <p className="vk-text-2xs text-muted-foreground">Karya</p>
          </div>
          <div className="px-2">
            <p className="vk-text-base font-bold">{scholar.stats.followers}</p>
            <p className="vk-text-2xs text-muted-foreground">Pengikut</p>
          </div>
          <div className="px-2">
            <p className="vk-text-base font-bold text-success">{scholar.stats.lmsMastery}%</p>
            <p className="vk-text-2xs text-muted-foreground">LMS Mastery</p>
          </div>
        </div>
      </section>
    </>
  );
};
