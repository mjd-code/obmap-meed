import type { UseFormReturn } from "react-hook-form";
import { ApiKeyManager } from "@/domains/settings/components/SettingsApiKeyManager";
import { Button } from "@/global/ui/button";
import { Input } from "@/global/ui/input";
import { Label } from "@/global/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/global/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/global/ui/alert-dialog";
import { Loader2, Trash2, Lock } from "lucide-react";
import type { PasswordFormValues } from "@/domains/settings/shared/hooks/useSettingsProfileController";

export interface SettingsProfileSecurityCardsProps {
  showPasswordForm: boolean;
  setShowPasswordForm: (open: boolean) => void;
  passwordForm: UseFormReturn<PasswordFormValues>;
  isChangingPassword: boolean;
  onPasswordSubmit: (values: PasswordFormValues) => void;
  isDeleting: boolean;
  onDeleteAccount: () => void;
}

/**
 * Pure declarative security cards (password update, API keys, danger zone) for ProfileSettings.
 */
export function SettingsProfileSecurityCards({
  showPasswordForm,
  setShowPasswordForm,
  passwordForm,
  isChangingPassword,
  onPasswordSubmit,
  isDeleting,
  onDeleteAccount,
}: SettingsProfileSecurityCardsProps) {
  return (
    <>
      {/* Password Management */}
      <Card>
        <CardHeader>
          <CardTitle>Keamanan & Kata Sandi</CardTitle>
          <CardDescription>Perbarui kata sandi akun Anda</CardDescription>
        </CardHeader>
        <CardContent>
          {!showPasswordForm ? (
            <Button variant="outline" onClick={() => setShowPasswordForm(true)}>
              <Lock className="mr-2 h-4 w-4" />
              Ubah Kata Sandi
            </Button>
          ) : (
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Kata Sandi Saat Ini</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...passwordForm.register("currentPassword")}
                />
                {passwordForm.formState.errors.currentPassword && (
                  <p className="text-xs text-destructive">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Kata Sandi Baru</Label>
                <Input id="newPassword" type="password" {...passwordForm.register("newPassword")} />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-xs text-destructive">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi Baru</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...passwordForm.register("confirmPassword")}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isChangingPassword}>
                  {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Kata Sandi
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowPasswordForm(false)}>
                  Batal
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <ApiKeyManager />

      {/* Delete Account */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Zona Bahaya</CardTitle>
          <CardDescription>Hapus akun beserta seluruh data secara permanen</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Hapus Akun
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Seluruh vault lokal maupun cloud, catatan
                  publik, dan pengaturan profil Anda akan dihapus secara permanen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Ya, Hapus Akun Saya
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </>
  );
}
