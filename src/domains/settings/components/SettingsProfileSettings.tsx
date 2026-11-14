import { AvatarUpload } from "@/domains/settings/components/SettingsAvatarUpload";
import { SettingsProfileSecurityCards } from "@/domains/settings/components/SettingsProfileSecurityCards";
import { Button } from "@/global/ui/button";
import { Input } from "@/global/ui/input";
import { Label } from "@/global/ui/label";
import { Textarea } from "@/global/ui/textarea";
import { Switch } from "@/global/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/global/ui/card";
import { Separator } from "@/global/ui/separator";
import { Loader2, Save, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { useSettingsProfileController } from "@/domains/settings/shared/hooks/useSettingsProfileController";

/** Declarative view for standalone public profile, password, and danger zone settings. */
export function ProfileSettings() {
  const ctrl = useSettingsProfileController();

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profil Publik</CardTitle>
          <CardDescription>
            Kelola identitas, username, dan keterlihatan profil Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <AvatarUpload />
            <div>
              <h3 className="font-medium">
                {ctrl.profile?.display_name || "Nama Anda"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {ctrl.profile?.email}
              </p>
              {ctrl.profile?.username && (
                <p className="text-xs font-mono text-primary mt-0.5">
                  @{ctrl.profile.username}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <form
            onSubmit={ctrl.profileForm.handleSubmit(ctrl.handleProfileSubmit)}
            className="space-y-4"
          >
            {/* Field Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username Publik</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-mono text-muted-foreground">
                  @
                </span>
                <Input
                  id="username"
                  placeholder="username_anda"
                  className="pl-7 pr-10 font-mono text-sm"
                  {...ctrl.profileForm.register("username", {
                    onChange: (e) => {
                      e.target.value = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_-]/g, "");
                    },
                  })}
                />
                <div className="absolute right-3 top-2.5">
                  {ctrl.isCheckingUsername && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  {!ctrl.isCheckingUsername &&
                    ctrl.isUsernameChanged &&
                    ctrl.usernameAvailable === true && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                  {!ctrl.isCheckingUsername &&
                    ctrl.isUsernameChanged &&
                    ctrl.usernameAvailable === false && (
                      <XCircle className="w-4 h-4 text-destructive" />
                    )}
                </div>
              </div>

              {ctrl.isUsernameChanged && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-500 space-y-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-4 h-4" />
                    Pemberitahuan Pengalihan 14 Hari
                  </div>
                  <p className="text-muted-foreground">
                    Jika Anda mengubah username, tautan lama Anda (
                    <code>/@{ctrl.profile?.username}/...</code>) akan dialihkan
                    ke username baru selama <strong>14 hari</strong> sebelum
                    nama lama dilepas untuk akun lain.
                  </p>
                </div>
              )}

              {ctrl.usernameMessage && ctrl.isUsernameChanged && (
                <p
                  className={`text-xs ${ctrl.usernameAvailable ? "text-emerald-500" : "text-destructive"}`}
                >
                  {ctrl.usernameMessage}
                </p>
              )}
              {ctrl.profileForm.formState.errors.username && (
                <p className="text-xs text-destructive">
                  {ctrl.profileForm.formState.errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_name">Nama Tampilan</Label>
              <Input
                id="display_name"
                placeholder="Mada Bajaka"
                {...ctrl.profileForm.register("display_name")}
              />
              {ctrl.profileForm.formState.errors.display_name && (
                <p className="text-xs text-destructive">
                  {ctrl.profileForm.formState.errors.display_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio / Deskripsi Singkat</Label>
              <Textarea
                id="bio"
                placeholder="Ceritakan tentang riset atau catatan Anda..."
                rows={3}
                {...ctrl.profileForm.register("bio")}
              />
              {ctrl.profileForm.formState.errors.bio && (
                <p className="text-xs text-destructive">
                  {ctrl.profileForm.formState.errors.bio.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_public">Profil Terbuka untuk Publik</Label>
                <p className="text-sm text-muted-foreground">
                  Izinkan orang lain melihat profil Anda di portal catatan publik
                </p>
              </div>
              <Switch
                id="is_public"
                checked={ctrl.profileForm.watch("is_public")}
                onCheckedChange={(checked) =>
                  ctrl.profileForm.setValue("is_public", checked)
                }
              />
            </div>

            <Button
              type="submit"
              disabled={
                ctrl.isSaving ||
                (ctrl.isUsernameChanged && ctrl.usernameAvailable === false)
              }
            >
              {ctrl.isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Simpan Perubahan
            </Button>
          </form>
        </CardContent>
      </Card>

      <SettingsProfileSecurityCards
        showPasswordForm={ctrl.showPasswordForm}
        setShowPasswordForm={ctrl.setShowPasswordForm}
        passwordForm={ctrl.passwordForm}
        isChangingPassword={ctrl.isChangingPassword}
        onPasswordSubmit={ctrl.handlePasswordSubmit}
        isDeleting={ctrl.isDeleting}
        onDeleteAccount={ctrl.handleDeleteAccount}
      />
    </div>
  );
}
