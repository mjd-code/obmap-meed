import React from "react";
import type { PartnerInvitationRecord } from "@/types/admin";
import type { ReleaseStage } from "@/types/collaboration";
import type { UserStatusFilter } from "@/domains/admin/shared/hooks/useAdminUserManagementController";
import { RELEASE_STAGE_LABELS } from "@/domains/auth/shared/api/ReleaseStageService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/global/ui/select";
import { Input } from "@/global/ui/input";
import { Button } from "@/global/ui/button";
import { Badge } from "@/global/ui/badge";
import { KeyRound, Shield } from "lucide-react";

interface AdminReleaseStageBarProps {
  releaseStage: ReleaseStage;
  stageUpdating: boolean;
  onStageChange: (stage: ReleaseStage) => void;
  inviteEmail: string;
  onInviteEmailChange: (email: string) => void;
  creatingInvite: boolean;
  onCreateInvite: () => void;
  invitations: PartnerInvitationRecord[];
  statusFilter: UserStatusFilter;
  onStatusFilterChange: (filter: UserStatusFilter) => void;
  pendingCount: number;
}

const FILTER_ITEMS: Array<{ key: UserStatusFilter; label: string }> = [
  { key: "all", label: "Semua" },
  { key: "pending_approval", label: "Antrean Approval" },
  { key: "active", label: "Aktif" },
  { key: "suspended", label: "Ditangguhkan" },
];

/** Declarative control bar for release stage switch, partner invitations, and approval queue filters. */
export const AdminReleaseStageBar: React.FC<AdminReleaseStageBarProps> = ({
  releaseStage,
  stageUpdating,
  onStageChange,
  inviteEmail,
  onInviteEmailChange,
  creatingInvite,
  onCreateInvite,
  invitations,
  statusFilter,
  onStatusFilterChange,
  pendingCount,
}) => {
  const latestPendingInvite = invitations.find((inv) => inv.status === "pending");

  return (
    <div className="space-y-3 rounded-lg border bg-card p-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground">Tahap Rilis Platform:</span>
          <div className="w-60">
            <Select
              disabled={stageUpdating}
              value={releaseStage}
              onValueChange={(v) => onStageChange(v as ReleaseStage)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stage_1_partner">{RELEASE_STAGE_LABELS.stage_1_partner}</SelectItem>
                <SelectItem value="stage_2_community_beta">
                  {RELEASE_STAGE_LABELS.stage_2_community_beta}
                </SelectItem>
                <SelectItem value="stage_3_commercial_ga">
                  {RELEASE_STAGE_LABELS.stage_3_commercial_ga}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={inviteEmail}
            onChange={(e) => onInviteEmailChange(e.target.value)}
            placeholder="Email mitra untuk kode undangan..."
            className="h-8 w-56 text-xs"
          />
          <Button
            size="sm"
            variant="secondary"
            className="h-8 text-xs"
            disabled={creatingInvite || !inviteEmail.trim()}
            onClick={onCreateInvite}
          >
            Buat Invite
          </Button>
          {latestPendingInvite && (
            <Badge variant="outline" className="font-mono text-[10px]">
              Terbaru: {latestPendingInvite.invite_code}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/50">
        {FILTER_ITEMS.map((item) => (
          <Button
            key={item.key}
            size="sm"
            variant={statusFilter === item.key ? "default" : "ghost"}
            className="h-7 px-2.5 text-xs gap-1.5"
            onClick={() => onStatusFilterChange(item.key)}
          >
            <span>{item.label}</span>
            {item.key === "pending_approval" && pendingCount > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                {pendingCount}
              </Badge>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
};
