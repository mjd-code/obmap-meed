import type { VaultMemberRole } from "@/types/collaboration";
import type { VaultMemberWithProfile } from "@/types/admin";
import { Button } from "@/global/ui/button";
import { Badge } from "@/global/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/global/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/global/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/global/ui/table";
import { Trash2, Loader2 } from "lucide-react";

export interface SettingsRolesMembersTableProps {
  members: VaultMemberWithProfile[];
  loadingMembers: boolean;
  canManageMembers: boolean;
  currentUserId?: string;
  onRoleChange: (memberUserId: string, newRole: VaultMemberRole) => void;
  onRemoveMember: (memberUserId: string) => void;
}

/**
 * Pure declarative collaborator table displaying active vault members and role actions.
 */
export function SettingsRolesMembersTable({
  members,
  loadingMembers,
  canManageMembers,
  currentUserId,
  onRoleChange,
  onRemoveMember,
}: SettingsRolesMembersTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Anggota</TableHead>
            <TableHead className="text-xs">Email</TableHead>
            <TableHead className="text-xs">Peran Vault</TableHead>
            {canManageMembers && <TableHead className="text-xs text-right">Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loadingMembers ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin inline mr-2 text-primary" />
                Memuat daftar kolaborator...
              </TableCell>
            </TableRow>
          ) : members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground">
                Belum ada kolaborator tambahan di vault ini. Undang tim Anda menggunakan form di
                atas.
              </TableCell>
            </TableRow>
          ) : (
            members.map((m) => {
              const initials = (m.display_name || m.email || "U").substring(0, 2).toUpperCase();
              const isSelf = currentUserId === m.user_id;

              return (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 border">
                        <AvatarImage src={m.avatar_url || ""} />
                        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-semibold text-foreground flex items-center gap-1">
                          {m.display_name || "Tanpa Nama"}
                          {isSelf && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0">
                              Anda
                            </Badge>
                          )}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">{m.email || "-"}</TableCell>

                  <TableCell>
                    {canManageMembers && !isSelf ? (
                      <div className="w-28">
                        <Select
                          value={m.role}
                          onValueChange={(val) => onRoleChange(m.user_id, val as VaultMemberRole)}
                        >
                          <SelectTrigger className="h-7 text-[11px]">
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
                    ) : (
                      <Badge variant="secondary" className="capitalize text-[10px]">
                        {m.role}
                      </Badge>
                    )}
                  </TableCell>

                  {canManageMembers && (
                    <TableCell className="text-right">
                      {!isSelf && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          title="Hapus Anggota"
                          onClick={() => onRemoveMember(m.user_id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
