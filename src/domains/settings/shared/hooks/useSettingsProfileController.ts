import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/domains/auth/shared/hooks/useAuth";
import { ProfileService } from "@/domains/settings/shared/api/ProfileService";

export const settingsProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(30, "Username maksimal 30 karakter")
    .regex(
      /^[a-z0-9_-]+$/,
      "Hanya huruf kecil, angka, underscore (_), atau hyphen (-)",
    )
    .optional()
    .or(z.literal("")),
  display_name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(100)
    .optional(),
  bio: z.string().max(500, "Bio maksimal 500 karakter").optional(),
  is_public: z.boolean(),
});

export const settingsPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi"),
    newPassword: z.string().min(8, "Kata sandi minimal 8 karakter").max(72),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Kata sandi konfirmasi tidak cocok",
    path: ["confirmPassword"],
  });

export type SettingsProfileFormData = z.infer<typeof settingsProfileSchema>;
export type SettingsPasswordFormData = z.infer<typeof settingsPasswordSchema>;

/**
 * Headless controller for SettingsProfileSettings.
 * Handles profile form state, debounced username validation, password update, and account deletion.
 */
export function useSettingsProfileController() {
  const {
    user,
    profile,
    updateProfile,
    updatePassword,
    deleteAccount,
    refreshProfile,
  } = useAuth();

  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  );
  const [usernameMessage, setUsernameMessage] = useState<string>("");

  const profileForm = useForm<SettingsProfileFormData>({
    resolver: zodResolver(settingsProfileSchema),
    defaultValues: {
      username: profile?.username || "",
      display_name: profile?.display_name || "",
      bio: profile?.bio || "",
      is_public: profile?.is_public ?? true,
    },
  });

  const passwordForm = useForm<SettingsPasswordFormData>({
    resolver: zodResolver(settingsPasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        username: profile.username || "",
        display_name: profile.display_name || "",
        bio: profile.bio || "",
        is_public: profile.is_public ?? true,
      });
    }
  }, [profile, profileForm]);

  const watchedUsername = profileForm.watch("username");
  const isUsernameChanged = Boolean(
    watchedUsername &&
      watchedUsername.trim().toLowerCase() !==
        (profile?.username || "").toLowerCase(),
  );

  useEffect(() => {
    if (!watchedUsername || !isUsernameChanged || watchedUsername.length < 3) {
      setUsernameAvailable(null);
      setUsernameMessage("");
      setIsCheckingUsername(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      const res = await ProfileService.checkUsernameAvailability(
        watchedUsername,
        user?.id,
      );
      setIsCheckingUsername(false);
      setUsernameAvailable(res.available);
      setUsernameMessage(
        res.available
          ? "Username tersedia!"
          : res.reason || "Username tidak tersedia",
      );
    }, 450);

    return () => clearTimeout(timer);
  }, [watchedUsername, isUsernameChanged, user?.id]);

  const handleProfileSubmit = useCallback(
    async (data: SettingsProfileFormData) => {
      if (!user) return;
      setIsSaving(true);

      try {
        if (isUsernameChanged && data.username) {
          if (usernameAvailable === false) {
            toast.error("Username yang dipilih tidak tersedia.");
            setIsSaving(false);
            return;
          }

          const claimRes = await ProfileService.claimOrUpdateUsername(
            user.id,
            data.username,
          );
          if (!claimRes.success) {
            toast.error(claimRes.error || "Gagal memperbarui username");
            setIsSaving(false);
            return;
          }
        }

        const { error } = await updateProfile({
          display_name: data.display_name,
          bio: data.bio,
          is_public: data.is_public,
        });

        if (error) {
          toast.error("Gagal memperbarui profil: " + error.message);
        } else {
          toast.success("Profil berhasil diperbarui!");
          await refreshProfile();
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat menyimpan";
        toast.error(message);
      } finally {
        setIsSaving(false);
      }
    },
    [isUsernameChanged, refreshProfile, updateProfile, user, usernameAvailable],
  );

  const handlePasswordSubmit = useCallback(
    async (data: SettingsPasswordFormData) => {
      setIsChangingPassword(true);
      const { error } = await updatePassword(data.newPassword);
      setIsChangingPassword(false);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Kata sandi berhasil diubah!");
        passwordForm.reset();
        setShowPasswordForm(false);
      }
    },
    [passwordForm, updatePassword],
  );

  const handleDeleteAccount = useCallback(async () => {
    setIsDeleting(true);
    const { error } = await deleteAccount();
    setIsDeleting(false);

    if (error) {
      toast.error("Gagal menghapus akun: " + error.message);
    }
  }, [deleteAccount]);

  return {
    profile,
    profileForm,
    passwordForm,
    isSaving,
    isChangingPassword,
    isDeleting,
    showPasswordForm,
    setShowPasswordForm,
    isCheckingUsername,
    usernameAvailable,
    usernameMessage,
    isUsernameChanged,
    handleProfileSubmit,
    handlePasswordSubmit,
    handleDeleteAccount,
  };
}
