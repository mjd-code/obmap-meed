import type { UseFormReturn } from "react-hook-form";
import {
  LogOut,
  ShieldCheck,
  Sparkles,
  Loader2,
  Save,
  AtSign,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/types/vault";
import { Button } from "@/global/ui/button";
import { Badge } from "@/global/ui/badge";
import { Input } from "@/global/ui/input";
import { Label } from "@/global/ui/label";
import { Textarea } from "@/global/ui/textarea";
import { Switch } from "@/global/ui/switch";
import { Card, CardContent } from "@/global/ui/card";
import { TabsContent } from "@/global/ui/tabs";
import { AvatarUpload } from "@/domains/settings/components/SettingsAvatarUpload";
import type {
  ProfileFormData,
  UsernameAvailabilityStatus,
} from "@/domains/settings/shared/hooks/useSettingsAccountController";

interface SettingsAccountProfileTabProps {
  user: User;
  profile: UserProfile | null;
  profileForm: UseFormReturn<ProfileFormData>;
  usernameStatus: UsernameAvailabilityStatus;
  usernameMessage: string | null;
  isUsernameChanged: boolean;
  isSubmitDisabled: boolean;
  isSavingProfile: boolean;
  currentDisplayUsername: string;
  onUsernameChange: (value: string) => void;
  onSubmitProfile: (data: ProfileFormData) => void;
  onSignOut: () => void;
}

/** Declarative view for the Profile & Session tab inside SettingsAccountSection. */
export function SettingsAccountProfileTab({
  user,
  profile,
  profileForm,
  usernameStatus,
  usernameMessage,
  isUsernameChanged,
  isSubmitDisabled,
  isSavingProfile,
  currentDisplayUsername,
  onUsernameChange,
  onSubmitProfile,
  onSignOut,
}: SettingsAccountProfileTabProps) {
  return (
    <TabsContent value="profile" className="mt-4 space-y-4">
      <Card className="border-border shadow-xs">
        {/* Top Identity Capsule */}
        <div className="p-4 sm:p-6 border-b border-border/60 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <AvatarUpload size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {profile?.display_name || user.email?.split("@")[0]}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {profile?.username && (
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4.5 px-1.5 font-mono"
                    >
                      @{profile.username}
                    </Badge>
                  )}
                  <Badge
                    variant={profile?.email_verified ? "default" : "outline"}
                    className="text-[10px] h-4.5 px-1.5"
                  >
                    <ShieldCheck className="mr-1 h-2.5 w-2.5" />
                    {profile?.email_verified
                      ? "Terverifikasi"
                      : "Belum Verifikasi"}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] h-4.5 px-1.5">
                    <Sparkles className="mr-1 h-2.5 w-2.5 text-primary" />
                    Akun Cloud
                  </Badge>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
              onClick={onSignOut}
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar Sesi
            </Button>
          </div>
        </div>

        {/* Bottom Form Section */}
        <CardContent className="p-4 sm:p-6 space-y-4">
          <form
            onSubmit={profileForm.handleSubmit(onSubmitProfile)}
            className="space-y-4"
          >
            {/* 1. FIELD USERNAME PUBLIK DENGAN LIVE CHECKER */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="username" className="text-xs font-medium">
                  Username Publik
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  Karakter a-z, 0-9, _, - (3-30 karakter)
                </span>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <AtSign className="w-3.5 h-3.5" />
                </div>
                <Input
                  id="username"
                  placeholder="username_anda"
                  {...profileForm.register("username")}
                  className="pl-8 pr-10 h-9 text-sm font-mono lowercase"
                  onChange={(e) => onUsernameChange(e.target.value)}
                />

                {/* Status Icon Indicator */}
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  {usernameStatus === "checking" && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  )}
                  {usernameStatus === "available" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  )}
                  {(usernameStatus === "taken" ||
                    usernameStatus === "invalid") && (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                </div>
              </div>

              {/* Status Helper Message */}
              {usernameMessage && (
                <p
                  className={`text-[11px] flex items-center gap-1 ${
                    usernameStatus === "available"
                      ? "text-emerald-500 font-medium"
                      : "text-destructive"
                  }`}
                >
                  {usernameStatus === "available" ? (
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                  ) : (
                    <XCircle className="w-3 h-3 shrink-0" />
                  )}
                  {usernameMessage}
                </p>
              )}

              {/* Live URL Preview Pill */}
              <div className="mt-1.5 p-2 rounded-md bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-muted-foreground text-[11px]">
                    URL Publik Anda:
                  </span>
                  <code className="text-primary font-mono text-[11px] truncate">
                    {window.location.origin}/p/{currentDisplayUsername}
                  </code>
                </div>
                {profile?.username && (
                  <a
                    href={`/p/${profile.username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 shrink-0 ml-2"
                  >
                    Buka Web <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* 14-Day Redirect Reservation Alert Banner */}
              {isUsernameChanged && profile?.username && (
                <div className="mt-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold">
                      Perhatian Pengalihan Alamat (14 Hari)
                    </p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Mengubah username akan mencadangkan alamat lama Anda (
                      <strong className="text-foreground">
                        @{profile.username}
                      </strong>
                      ) selama <strong>14 hari</strong>. Semua pengunjung yang
                      membuka tautan lama Anda akan dialihkan secara otomatis ke
                      username baru ini sebelum alamat lama dilepas ke publik.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 2. NAMA TAMPILAN */}
            <div className="space-y-1.5">
              <Label htmlFor="display_name" className="text-xs font-medium">
                Nama Tampilan
              </Label>
              <Input
                id="display_name"
                placeholder="Nama lengkap atau alias Anda"
                {...profileForm.register("display_name")}
                className="h-9 text-sm"
              />
              {profileForm.formState.errors.display_name && (
                <p className="text-[11px] text-destructive">
                  {profileForm.formState.errors.display_name.message}
                </p>
              )}
            </div>

            {/* 3. BIO SINGKAT */}
            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-xs font-medium">
                Bio Singkat
              </Label>
              <Textarea
                id="bio"
                placeholder="Ceritakan sedikit tentang Anda atau proyek catatan Anda..."
                rows={2}
                {...profileForm.register("bio")}
                className="text-sm resize-none"
              />
            </div>

            {/* 4. TOGGLE PROFIL PENULIS PUBLIK */}
            <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-card/60">
              <div className="space-y-0.5">
                <Label
                  htmlFor="is_public"
                  className="text-xs font-medium cursor-pointer"
                >
                  Profil Penulis Publik
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Izinkan nama dan avatar Anda muncul di header portal pembaca
                  publik ketika menerbitkan catatan.
                </p>
              </div>
              <Switch
                id="is_public"
                checked={profileForm.watch("is_public")}
                onCheckedChange={(checked) =>
                  profileForm.setValue("is_public", checked)
                }
              />
            </div>

            {/* TOMBOL SIMPAN */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                size="sm"
                className="gap-2"
                disabled={isSubmitDisabled}
              >
                {isSavingProfile ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
