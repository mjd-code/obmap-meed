import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/domains/auth/shared/hooks/useAuth";
import { ProfileService } from "@/domains/settings/shared/api/ProfileService";

export const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(30, "Username maksimal 30 karakter")
    .regex(
      /^[a-z0-9_-]+$/,
      "Hanya huruf kecil, angka, underscore (_), atau strip (-)",
    )
    .optional()
    .or(z.literal("")),
  display_name: z.string().min(2, "Nama minimal 2 karakter").max(100).optional(),
  bio: z.string().max(500, "Bio maksimal 500 karakter").optional(),
  is_public: z.boolean(),
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Kata sandi saat ini diperlukan"),
    newPassword: z.string().min(8, "Kata sandi baru minimal 8 karakter").max(72),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  });

export type ProfileFormData = z.infer<typeof profileSchema>;
export type PasswordFormData = z.infer<typeof passwordSchema>;
export type UsernameAvailabilityStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid";

/**
 * Headless controller for SettingsAccountSection.
 * Manages profile editing, debounced username availability validation, password changes, and account deletion.
 */
export function useSettingsAccountController(initialTab = "profile") {
  const navigate = useNavigate();
  const {
    user,
    profile,
    loading,
    signOut,
    updatePassword,
    updateProfile,
    deleteAccount,
    refreshProfile,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<string>(
    initialTab === "security" ? "security" : "profile",
  );
  useEffect(() => {
    setActiveTab(initialTab === "security" ? "security" : "profile");
  }, [initialTab]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // State Modal Keamanan
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // State Validasi Ketersediaan Username
  const [usernameStatus, setUsernameStatus] =
    useState<UsernameAvailabilityStatus>("idle");
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile?.username || "",
      display_name: profile?.display_name || "",
      bio: profile?.bio || "",
      is_public: profile?.is_public ?? true,
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Sinkronisasi data saat profile selesai dimuat dari backend
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

  // Debounced Availability Checker (450ms)
  useEffect(() => {
    if (!watchedUsername || !isUsernameChanged) {
      setUsernameStatus("idle");
      setUsernameMessage(null);
      return;
    }

    const clean = watchedUsername.trim().toLowerCase();
    const formatCheck = ProfileService.validateUsernameFormat(clean);
    if (!formatCheck.valid) {
      setUsernameStatus("invalid");
      setUsernameMessage(formatCheck.error || "Format username tidak valid");
      return;
    }

    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      const res = await ProfileService.checkUsernameAvailability(clean, user?.id);
      if (res.available) {
        setUsernameStatus("available");
        setUsernameMessage("Username tersedia");
      } else {
        setUsernameStatus("taken");
        setUsernameMessage(
          res.reason ||
            "Username sudah digunakan atau sedang dalam masa pengalihan",
        );
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [watchedUsername, isUsernameChanged, user?.id]);

  // Handler Submit Profil & Klaim Username
  const handleProfileSubmit = useCallback(
    async (data: ProfileFormData) => {
      if (!user) return;
      setIsSavingProfile(true);

      try {
        const cleanUsername = data.username?.trim().toLowerCase();

        // Jika ada perubahan username, jalankan klaim & reservasi redirect 14 hari
        if (
          cleanUsername &&
          cleanUsername !== (profile?.username || "").toLowerCase()
        ) {
          const claimResult = await ProfileService.claimOrUpdateUsername(
            user.id,
            cleanUsername,
          );
          if (!claimResult.success) {
            toast.error(claimResult.error || "Gagal mengklaim username.");
            setIsSavingProfile(false);
            return;
          }
          toast.info(
            "Username berhasil diperbarui. Alamat URL publik Anda telah dialihkan secara otomatis.",
          );
        }

        // Update kolom display_name, bio, dan paksa is_public: true jika username ada
        const { error } = await updateProfile({
          display_name: data.display_name,
          bio: data.bio,
          is_public: Boolean(cleanUsername) ? true : Boolean(data.is_public),
        });

        if (error) throw error;

        await refreshProfile();
        toast.success("Profil dan identitas publik berhasil disimpan!");
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Gagal menyimpan perubahan profil.";
        toast.error(message);
      } finally {
        setIsSavingProfile(false);
      }
    },
    [profile?.username, refreshProfile, updateProfile, user],
  );

  // Handler Ganti Password
  const handlePasswordSubmit = useCallback(
    async (data: PasswordFormData) => {
      setIsUpdatingPassword(true);
      try {
        const { error } = await updatePassword(data.newPassword);
        if (error) {
          toast.error(`Gagal memperbarui kata sandi: ${error.message}`);
        } else {
          toast.success("Kata sandi berhasil diubah");
          setIsPasswordModalOpen(false);
          passwordForm.reset();
        }
      } catch {
        toast.error("Gagal mengubah kata sandi");
      } finally {
        setIsUpdatingPassword(false);
      }
    },
    [passwordForm, updatePassword],
  );

  // Handler Hapus Akun
  const handleDeleteAccount = useCallback(async () => {
    setIsDeletingAccount(true);
    try {
      const { error } = await deleteAccount();
      if (error) {
        toast.error(`Gagal menghapus akun: ${error.message}`);
      } else {
        toast.success("Akun berhasil dihapus");
        navigate("/auth");
      }
    } catch {
      toast.error("Gagal menghapus akun");
    } finally {
      setIsDeletingAccount(false);
    }
  }, [deleteAccount, navigate]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/auth");
  }, [navigate, signOut]);

  const handleNavigateAuth = useCallback(() => {
    navigate("/auth");
  }, [navigate]);

  const handleUsernameInputChange = useCallback(
    (rawValue: string) => {
      const cleanVal = rawValue.toLowerCase().replace(/\s+/g, "");
      profileForm.setValue("username", cleanVal, { shouldValidate: true });
    },
    [profileForm],
  );

  const isSubmitDisabled =
    isSavingProfile ||
    usernameStatus === "checking" ||
    usernameStatus === "taken" ||
    usernameStatus === "invalid";

  const currentDisplayUsername =
    watchedUsername?.trim().toLowerCase() || profile?.username || "username";

  return {
    user,
    profile,
    loading,
    activeTab,
    setActiveTab,
    isSavingProfile,
    isPasswordModalOpen,
    setIsPasswordModalOpen,
    isApiKeyModalOpen,
    setIsApiKeyModalOpen,
    isUpdatingPassword,
    isDeletingAccount,
    usernameStatus,
    usernameMessage,
    isUsernameChanged,
    isSubmitDisabled,
    currentDisplayUsername,
    profileForm,
    passwordForm,
    handleProfileSubmit,
    handlePasswordSubmit,
    handleDeleteAccount,
    handleSignOut,
    handleNavigateAuth,
    handleUsernameInputChange,
  };
}
