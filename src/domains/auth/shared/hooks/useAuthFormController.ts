import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/domains/auth/shared/hooks/useAuth";
import { ProfileService } from "@/domains/settings/shared/api/ProfileService";

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid").max(255),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(30, "Username maksimal 30 karakter")
    .regex(/^[a-z0-9_-]+$/, "Hanya huruf kecil, angka, underscore (_), atau hyphen (-)"),
  email: z.string().email("Format email tidak valid").max(255),
  password: z.string().min(8, "Kata sandi minimal 8 karakter").max(72),
  displayName: z.string().min(2, "Nama minimal 2 karakter").max(100).optional(),
});

export const resetSchema = z.object({
  email: z.string().email("Format email tidak valid").max(255),
});

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "Kata sandi minimal 8 karakter").max(72),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Kata sandi konfirmasi tidak cocok",
    path: ["confirmPassword"],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ResetFormValues = z.infer<typeof resetSchema>;
export type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

export type AuthMode = "login" | "register" | "reset" | "update-password";

export interface UseAuthFormControllerParams {
  initialMode: AuthMode;
  onSuccess?: () => void;
}

/**
 * Headless controller for AuthForm: configures zod-validated forms,
 * debounced public username availability lookup, and auth submission flows.
 */
export function useAuthFormController({ initialMode, onSuccess }: UseAuthFormControllerParams) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, signInWithGoogle, resetPassword, updatePassword } = useAuth();

  // State ketersediaan username saat registrasi
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState<string>("");

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "", displayName: "" },
    mode: "onChange",
  });

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: "" },
  });

  const updatePasswordForm = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  // Debounce check ketersediaan username
  const watchedUsername = registerForm.watch("username");
  useEffect(() => {
    if (!watchedUsername || watchedUsername.length < 3) {
      setUsernameAvailable(null);
      setUsernameMessage("");
      setIsCheckingUsername(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingUsername(true);
      const res = await ProfileService.checkUsernameAvailability(watchedUsername);
      setIsCheckingUsername(false);
      setUsernameAvailable(res.available);
      setUsernameMessage(res.available ? "Username tersedia!" : (res.reason || "Username tidak tersedia"));
    }, 450);

    return () => clearTimeout(timer);
  }, [watchedUsername]);

  const handleLogin = async (data: LoginFormValues) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Selamat datang kembali!");
      onSuccess?.();
    }
  };

  const handleRegister = async (data: RegisterFormValues) => {
    if (usernameAvailable === false) {
      toast.error("Silakan pilih username lain yang masih tersedia.");
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(data.email, data.password, data.displayName, data.username);
    setIsLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("Email ini sudah terdaftar. Silakan login.");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Pendaftaran berhasil! Silakan periksa email Anda untuk verifikasi.");
      setMode("login");
    }
  };

  const handleReset = async (data: ResetFormValues) => {
    setIsLoading(true);
    const { error } = await resetPassword(data.email);
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Tautan reset kata sandi telah dikirim ke email Anda.");
      setMode("login");
    }
  };

  const handleUpdatePassword = async (data: UpdatePasswordFormValues) => {
    setIsLoading(true);
    const { error } = await updatePassword(data.password);
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Kata sandi berhasil diperbarui!");
      onSuccess?.();
    }
  };

  return {
    mode,
    setMode,
    showPassword,
    toggleShowPassword: () => setShowPassword((prev) => !prev),
    isLoading,
    signInWithGoogle,
    loginForm,
    registerForm,
    resetForm,
    updatePasswordForm,
    watchedUsername,
    isCheckingUsername,
    usernameAvailable,
    usernameMessage,
    handleLogin,
    handleRegister,
    handleReset,
    handleUpdatePassword,
  };
}
