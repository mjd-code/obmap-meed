import React from "react";
import { UserPlus, Trash2, Loader2, Cloud, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/global/ui/avatar";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import { Input } from "@/global/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/global/ui/select";
import {
  VAULT_MEMBER_ROLE_CONFIG,
  useVaultMemberController,
} from "@/domains/vault/shared/hooks/useVaultMemberController";
import type { VaultMemberRole } from "@/types/collaboration";

export interface VaultMemberSectionProps {
  vaultId: string;
  vaultName: string;
  isCloud: boolean;
  currentUserId?: string;
  isOwnerOrAdmin: boolean;
  onCloudSyncEnable?: () => void;
}

const INVITABLE_ROLES: VaultMemberRole[] = ["admin", "editor", "contributor", "viewer"];

/**
 * Pure declarative collaborator management panel for a cloud vault.
 */
export const VaultMemberSection: React.FC<VaultMemberSectionProps> = ({
  vaultId,
  vaultName,
  isCloud,
  currentUserId,
  isOwnerOrAdmin,
  onCloudSyncEnable,
}) => {
  const {
    members,
    loading,
    searchQuery,
    suggestions,
    isSearching,
    showSuggestions,
    selectedUser,
    selectedRole,
    setSelectedRole,
    isSubmitting,
    searchBoxRef,
    handleSearchChange,
    handleSearchFocus,
    handleSelectUser,
    handleInvite,
    handleRoleChange,
    handleRemoveMember,
  } = useVaultMemberController({ vaultId, isCloud, currentUserId });

  // 1. Kondisi jika Local Vault: Tampilkan Ajakan Cloud Sync yang Ramah
  if (!isCloud) {
    return (
      <div className="p-3.5 rounded-lg border border-dashed border-border/80 bg-muted/20 text-center space-y-2">
        <div className="w-8 h-8 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Cloud className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-medium text-foreground">Kolaborasi Khusus Cloud Vault</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Aktifkan Sinkronisasi Cloud untuk mengundang kolaborator ke vault ini.
          </p>
        </div>
        {onCloudSyncEnable && (
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={onCloudSyncEnable}>
            <Cloud className="w-3.5 h-3.5" />
            Aktifkan Cloud Sync Sekarang
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2 text-xs">
      {/* Form Tambah Anggota (Khusus Owner/Admin) */}
      {isOwnerOrAdmin && (
        <div className="p-2.5 rounded-lg border border-border/70 bg-secondary/20 space-y-2">
          <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-[11px]">
            <UserPlus className="w-3.5 h-3.5 text-primary" />
            <span>Undang Kolaborator ke {vaultName}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Input Pencarian dengan Floating Popover */}
            <div ref={searchBoxRef} className="relative flex-1">
              <div className="relative">
                <Input
                  placeholder="Ketik Gmail atau User ID..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={handleSearchFocus}
                  className="h-8 text-xs pl-8 pr-7 bg-background"
                />
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                {isSearching && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground absolute right-2.5 top-2.5" />
                )}
              </div>

              {/* Floating Dropdown Autocomplete */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-md animate-in fade-in-50">
                  {suggestions.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-muted text-xs transition-colors"
                    >
                      <Avatar className="w-5 h-5 shrink-0">
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback className="text-[9px]">
                          {(user.display_name || user.email || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">
                          {user.display_name || "Pengguna Terdaftar"}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{user.email || user.id}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {showSuggestions && !isSearching && suggestions.length === 0 && searchQuery.length >= 2 && (
                <div className="absolute z-50 left-0 right-0 mt-1 rounded-md border border-border bg-popover p-2 text-center text-[11px] text-muted-foreground shadow-md">
                  Tidak ada pengguna cocok ditemukan.
                </div>
              )}
            </div>

            {/* Pemilih Peran */}
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as VaultMemberRole)}>
              <SelectTrigger className="h-8 text-xs w-full sm:w-32 bg-background shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVITABLE_ROLES.map((r) => {
                  const cfg = VAULT_MEMBER_ROLE_CONFIG[r];
                  const Icon = cfg.icon;
                  return (
                    <SelectItem key={r} value={r} className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cfg.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Tombol Undang */}
            <Button
              size="sm"
              onClick={handleInvite}
              disabled={!selectedUser || isSubmitting}
              className="h-8 text-xs px-3 shrink-0 gap-1"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>Undang</span>
            </Button>
          </div>
        </div>
      )}

      {/* Daftar Anggota Aktif */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
          <span>Anggota Vault ({members.length})</span>
          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
        </div>

        {members.length === 0 && !loading ? (
          <p className="text-[11px] text-muted-foreground text-center py-2 bg-muted/10 rounded-md border border-border/40">
            Belum ada kolaborator luar yang ditambahkan ke vault ini.
          </p>
        ) : (
          <div className="divide-y divide-border/40 rounded-md border border-border/50 bg-background/50 overflow-hidden">
            {members.map((member) => {
              const isOwnerRow = member.id.startsWith("owner-");
              const cfg = isOwnerRow
                ? { label: "Pemilik", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" }
                : VAULT_MEMBER_ROLE_CONFIG[member.role] || VAULT_MEMBER_ROLE_CONFIG.viewer;
              const isSelf = member.user_id === currentUserId;

              return (
                <div key={member.id} className="flex items-center justify-between p-2 gap-2 hover:bg-muted/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="w-6 h-6 shrink-0">
                      <AvatarImage src={member.avatar_url || ""} />
                      <AvatarFallback className="text-[9px]">
                        {(member.display_name || member.email || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate text-[11px]">
                        {member.display_name || member.email || "Anggota"}
                        {isSelf && <span className="ml-1 text-[10px] text-muted-foreground">(Anda)</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">{member.email || member.user_id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isOwnerRow ? (
                      <Badge variant="outline" className={`text-[10px] h-5 px-1.5 font-medium ${cfg.color}`}>
                        Pemilik Utama
                      </Badge>
                    ) : isOwnerOrAdmin && !isSelf ? (
                      <>
                        <Select
                          value={member.role}
                          onValueChange={(val) => handleRoleChange(member.user_id, val as VaultMemberRole)}
                        >
                          <SelectTrigger className="h-6 text-[10px] px-2 w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {INVITABLE_ROLES.map((r) => (
                              <SelectItem key={r} value={r} className="text-[11px]">
                                {VAULT_MEMBER_ROLE_CONFIG[r].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveMember(member.user_id)}
                          title="Cabut Akses"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <Badge variant="outline" className={`text-[10px] h-5 px-1.5 font-medium ${cfg.color}`}>
                        {cfg.label}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
