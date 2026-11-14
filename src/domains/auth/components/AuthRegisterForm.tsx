import type { UseFormReturn } from "react-hook-form";
import { Button } from "@/global/ui/button";
import { Input } from "@/global/ui/input";
import { Label } from "@/global/ui/label";
import { PasswordStrengthIndicator } from "@/domains/auth/components/AuthPasswordStrengthIndicator";
import { Loader2, Mail, Lock, User, Eye, EyeOff, CheckCircle2, XCircle, AtSign } from "lucide-react";
import type { RegisterFormValues } from "@/domains/auth/shared/hooks/useAuthFormController";

export interface AuthRegisterFormProps {
  form: UseFormReturn<RegisterFormValues>;
  watchedUsername: string;
  isCheckingUsername: boolean;
  usernameAvailable: boolean | null;
  usernameMessage: string;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  isLoading: boolean;
  onSubmit: (data: RegisterFormValues) => void;
}

/**
 * Pure declarative registration form with real-time public username check and password strength meter.
 */
export function AuthRegisterForm({
  form,
  watchedUsername,
  isCheckingUsername,
  usernameAvailable,
  usernameMessage,
  showPassword,
  onToggleShowPassword,
  isLoading,
  onSubmit,
}: AuthRegisterFormProps) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="register-username">
          Username Publik <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="register-username"
            placeholder="username_anda"
            className="pl-9 pr-10 font-mono text-sm"
            {...form.register("username", {
              onChange: (e) => {
                e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
              },
            })}
          />
          <div className="absolute right-3 top-3">
            {isCheckingUsername && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            {!isCheckingUsername && usernameAvailable === true && (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
            {!isCheckingUsername && usernameAvailable === false && (
              <XCircle className="w-4 h-4 text-destructive" />
            )}
          </div>
        </div>
        {usernameMessage && (
          <p className={`text-xs ${usernameAvailable ? "text-emerald-500" : "text-destructive"}`}>
            {usernameMessage}
          </p>
        )}
        {form.formState.errors.username && (
          <p className="text-xs text-destructive">{form.formState.errors.username.message}</p>
        )}
        <p className="text-[11px] text-muted-foreground">
          Digunakan untuk alamat URL publik Anda: /p/
          <span className="text-foreground font-mono">{watchedUsername || "username"}</span>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayName">Nama Tampilan</Label>
        <div className="relative">
          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="displayName"
            placeholder="Mada Bajaka"
            className="pl-9"
            {...form.register("displayName")}
          />
        </div>
        {form.formState.errors.displayName && (
          <p className="text-xs text-destructive">{form.formState.errors.displayName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="register-email"
            type="email"
            placeholder="nama@email.com"
            className="pl-9"
            {...form.register("email")}
          />
        </div>
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Kata Sandi</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            id="register-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="pl-9 pr-9"
            {...form.register("password")}
          />
          <button
            type="button"
            onClick={onToggleShowPassword}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <PasswordStrengthIndicator password={form.watch("password") || ""} />
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading || usernameAvailable === false}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Daftar Sekarang
      </Button>
    </form>
  );
}
