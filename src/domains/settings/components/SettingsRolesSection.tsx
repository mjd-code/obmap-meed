import type { VaultMemberRole } from "@/types/collaboration";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/global/ui/card";
import { Button } from "@/global/ui/button";
import { Badge } from "@/global/ui/badge";
import { Input } from "@/global/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/global/ui/select";
import {
  ShieldCheck,
  UserPlus,
  ExternalLink,
  Mail,
  Loader2,
  Shield,
  Info,
  FolderGit2,
} from "lucide-react";
import {
  ROLE_DEFINITIONS,
  useSettingsRolesController,
} from "@/domains/settings/shared/hooks/useSettingsRolesController";
import { SettingsRolesMembersTable } from "@/domains/settings/components/SettingsRolesMembersTable";

/** Declarative view for active vault collaborator roles, invitations, and RBAC matrix. */
export function RolesSettings() {
  const ctrl = useSettingsRolesController();

  return (
    <div className="space-y-6">
      {/* 1. Superadmin Gateway Banner (Hanya muncul jika Superadmin) */}
      {ctrl.isSuperadmin && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/20 text-primary">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    Akses Khusus Superadmin Platform
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Anda memiliki hak akses tertinggi untuk mengelola seluruh pengguna dan subsistem.
                  </CardDescription>
                </div>
              </div>
              <Button size="sm" onClick={ctrl.openAdminCockpit} className="gap-1.5 text-xs h-8">
                Buka Cockpit Admin
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* 2. Manajer Anggota Vault Aktif */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-primary" />
              <div>
                <CardTitle className="text-sm font-semibold">Kolaborator Vault Aktif</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Kelola siapa saja yang memiliki akses menulis, meninjau, dan menerbitkan catatan
                  di ruang kerja ini.
                </CardDescription>
              </div>
            </div>
            {ctrl.currentVaultId && (
              <Badge variant="outline" className="text-[11px] font-mono">
                Vault ID: {ctrl.currentVaultId.substring(0, 8)}...
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {ctrl.permissions.canManageMembers ? (
            <form onSubmit={ctrl.handleInviteMember} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Ketik email pengguna terdaftar..."
                  value={ctrl.inviteEmail}
                  onChange={(e) => ctrl.setInviteEmail(e.target.value)}
                  className="pl-8 h-9 text-xs"
                  required
                />
              </div>

              <div className="w-full sm:w-36">
                <Select
                  value={ctrl.selectedRole}
                  onValueChange={(val) => ctrl.setSelectedRole(val as VaultMemberRole)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="contributor">Contributor</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={ctrl.inviting} size="sm" className="h-9 text-xs gap-1.5 shrink-0">
                {ctrl.inviting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                Undang Anggota
              </Button>
            </form>
          ) : (
            <div className="p-3 bg-muted/30 border rounded-lg text-xs text-muted-foreground flex items-center gap-2">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <span>
                Hanya Pemilik atau Admin vault yang memiliki hak untuk menambah dan mengubah anggota.
              </span>
            </div>
          )}

          <SettingsRolesMembersTable
            members={ctrl.members}
            loadingMembers={ctrl.loadingMembers}
            canManageMembers={ctrl.permissions.canManageMembers}
            currentUserId={ctrl.userId}
            onRoleChange={ctrl.handleRoleChange}
            onRemoveMember={ctrl.handleRemoveMember}
          />
        </CardContent>
      </Card>

      {/* 3. Matriks Edukasi Peran */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Panduan Tingkatan Hak Akses (RBAC Matrix)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {ROLE_DEFINITIONS.map((r) => (
            <div key={r.role} className="p-3 rounded-lg border bg-card/60 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-foreground">{r.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
