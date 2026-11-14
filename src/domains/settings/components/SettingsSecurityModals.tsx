import type { UseFormReturn } from "react-hook-form";
import { Key, Lock, Loader2 } from "lucide-react";
import { Button } from "@/global/ui/button";
import { Input } from "@/global/ui/input";
import { Label } from "@/global/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/global/ui/dialog";
import { ApiKeyManager } from "@/domains/settings/components/SettingsApiKeyManager";
import type { PasswordFormData } from "@/domains/settings/shared/hooks/useSettingsAccountController";

interface SettingsSecurityModalsProps {
  isPasswordModalOpen: boolean;
  onPasswordModalOpenChange: (open: boolean) => void;
  isApiKeyModalOpen: boolean;
  onApiKeyModalOpenChange: (open: boolean) => void;
  passwordForm: UseFormReturn<PasswordFormData>;
  isUpdatingPassword: boolean;
  onSubmitPassword: (data: PasswordFormData) => void;
}

/** Declarative security modals for updating account password and managing API keys. */
export function SettingsSecurityModals({
  isPasswordModalOpen,
  onPasswordModalOpenChange,
  isApiKeyModalOpen,
  onApiKeyModalOpenChange,
  passwordForm,
  isUpdatingPassword,
  onSubmitPassword,
}: SettingsSecurityModalsProps) {
  return (
    <>
      {/* Modal Dialog Ganti Kata Sandi */}
      <Dialog
        open={isPasswordModalOpen}
        onOpenChange={onPasswordModalOpenChange}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" /> Perbarui Kata Sandi
            </DialogTitle>
            <DialogDescription className="text-xs">
              Masukkan kata sandi baru minimal 8 karakter.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
            className="space-y-3.5"
          >
            <div className="space-y-1">
              <Label className="text-xs">Kata Sandi Saat Ini</Label>
              <Input
                type="password"
                {...passwordForm.register("currentPassword")}
                className="h-8 text-xs"
              />
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-[10px] text-destructive">
                  {passwordForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Kata Sandi Baru</Label>
              <Input
                type="password"
                {...passwordForm.register("newPassword")}
                className="h-8 text-xs"
              />
              {passwordForm.formState.errors.newPassword && (
                <p className="text-[10px] text-destructive">
                  {passwordForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Konfirmasi Kata Sandi Baru</Label>
              <Input
                type="password"
                {...passwordForm.register("confirmPassword")}
                className="h-8 text-xs"
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-[10px] text-destructive">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPasswordModalOpenChange(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isUpdatingPassword}
                className="text-xs"
              >
                {isUpdatingPassword ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : null}
                Simpan Kata Sandi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog API Keys */}
      <Dialog open={isApiKeyModalOpen} onOpenChange={onApiKeyModalOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" /> Kunci API & Token
              Integrasi
            </DialogTitle>
            <DialogDescription className="text-xs">
              Kunci akses programmatic untuk berinteraksi dengan API
              sinkronisasi catatan graf Anda.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <ApiKeyManager />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
