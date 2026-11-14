/**
 * src/domains/settings/sections/AccountSettings.tsx
 * Unified Account & Profile Section
 */

import { User, LogIn, Key, Lock, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/global/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/global/ui/tabs";
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
import { SettingsAccountProfileTab } from "@/domains/settings/components/SettingsAccountProfileTab";
import { SettingsSecurityModals } from "@/domains/settings/components/SettingsSecurityModals";
import { useSettingsAccountController } from "@/domains/settings/shared/hooks/useSettingsAccountController";

export interface AccountSettingsProps {
  initialTab?: "profile" | "security" | string;
}

/** Declarative view for account profile management, session status, and security credentials. */
export function AccountSettings({
  initialTab = "profile",
}: {
  initialTab?: string;
}) {
  const controller = useSettingsAccountController(initialTab);

  // State: Belum Login
  if (!controller.user && !controller.loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-border bg-card/40">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
          <User className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          Sesi Akun Belum Terhubung
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
          Masuk atau buat akun Lovable Cloud untuk menyinkronkan vault catatan
          Anda, mengelola kredensial, dan berkolaborasi.
        </p>
        <Button
          onClick={controller.handleNavigateAuth}
          size="sm"
          className="gap-2"
        >
          <LogIn className="w-4 h-4" /> Masuk ke Akun
        </Button>
      </div>
    );
  }

  if (controller.loading || !controller.user) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-xs gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-primary" /> Memuat data
        akun...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs
        value={controller.activeTab}
        onValueChange={controller.setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 h-10 p-1 bg-muted/60">
          <TabsTrigger
            value="profile"
            className="text-xs sm:text-sm font-medium gap-1.5"
          >
            <User className="w-3.5 h-3.5" />
            Profil & Sesi
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="text-xs sm:text-sm font-medium gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            Keamanan & Kredensial
          </TabsTrigger>
        </TabsList>

        <SettingsAccountProfileTab
          user={controller.user}
          profile={controller.profile}
          profileForm={controller.profileForm}
          usernameStatus={controller.usernameStatus}
          usernameMessage={controller.usernameMessage}
          isUsernameChanged={controller.isUsernameChanged}
          isSubmitDisabled={controller.isSubmitDisabled}
          isSavingProfile={controller.isSavingProfile}
          currentDisplayUsername={controller.currentDisplayUsername}
          onUsernameChange={controller.handleUsernameInputChange}
          onSubmitProfile={controller.handleProfileSubmit}
          onSignOut={controller.handleSignOut}
        />

        {/* TAB 2: KEAMANAN & KREDENSIAL */}
        <TabsContent value="security" className="mt-4 space-y-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border/60 shadow-xs">
            {/* Baris 1: Kata Sandi */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Kata Sandi Akun
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Perbarui kata sandi akun secara berkala untuk menjaga
                    keamanan ruang kerja Anda.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs shrink-0"
                onClick={() => controller.setIsPasswordModalOpen(true)}
              >
                Ganti Kata Sandi
              </Button>
            </div>

            {/* Baris 2: API Keys & Token */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Kunci API & Integrasi
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Token otorisasi untuk API sinkronisasi catatan dan automasi
                    eksternal.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs shrink-0"
                onClick={() => controller.setIsApiKeyModalOpen(true)}
              >
                Kelola API Keys
              </Button>
            </div>

            {/* Baris 3: Hapus Akun (Danger Zone) */}
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4 bg-destructive/5 hover:bg-destructive/10 transition-colors">
              <div className="flex items-center gap-3.5">
                <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-destructive">
                    Zona Bahaya: Hapus Akun
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Menghapus akun Anda secara permanen beserta akses cloud
                    vault pribadi.
                  </p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs shrink-0 gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus Akun
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-base text-destructive">
                      Konfirmasi Penghapusan Akun Permanen
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-xs">
                      Tindakan ini tidak dapat dibatalkan. Seluruh data profil
                      Anda dan vault cloud pribadi yang terhubung akan dihapus
                      secara permanen dari server.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="text-xs">
                      Batal
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={controller.handleDeleteAccount}
                      disabled={controller.isDeletingAccount}
                      className="bg-destructive hover:bg-destructive/90 text-xs"
                    >
                      {controller.isDeletingAccount
                        ? "Menghapus..."
                        : "Ya, Hapus Akun Saya"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <SettingsSecurityModals
        isPasswordModalOpen={controller.isPasswordModalOpen}
        onPasswordModalOpenChange={controller.setIsPasswordModalOpen}
        isApiKeyModalOpen={controller.isApiKeyModalOpen}
        onApiKeyModalOpenChange={controller.setIsApiKeyModalOpen}
        passwordForm={controller.passwordForm}
        isUpdatingPassword={controller.isUpdatingPassword}
        onSubmitPassword={controller.handlePasswordSubmit}
      />
    </div>
  );
}
