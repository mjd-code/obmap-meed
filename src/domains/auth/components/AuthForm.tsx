import { Button } from "@/global/ui/button";
import { Input } from "@/global/ui/input";
import { Label } from "@/global/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/global/ui/card";
import { PasswordStrengthIndicator } from "@/domains/auth/components/AuthPasswordStrengthIndicator";
import { AuthRegisterForm } from "@/domains/auth/components/AuthRegisterForm";
import {
  useAuthFormController,
  type AuthMode,
} from "@/domains/auth/shared/hooks/useAuthFormController";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

export type { AuthMode };

export interface AuthFormProps {
  initialMode?: AuthMode;
  onSuccess?: () => void;
}

/**
 * Pure declarative authentication card handling login, registration, password reset,
 * password update, and Google OAuth entry points.
 */
export function AuthForm({ initialMode = "login", onSuccess }: AuthFormProps) {
  const {
    mode,
    setMode,
    showPassword,
    toggleShowPassword,
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
  } = useAuthFormController({ initialMode, onSuccess });

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-border">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          {mode === "login" && "Masuk ke Akun"}
          {mode === "register" && "Daftar Akun Baru"}
          {mode === "reset" && "Atur Ulang Kata Sandi"}
          {mode === "update-password" && "Kata Sandi Baru"}
        </CardTitle>
        <CardDescription>
          {mode === "login" && "Masuk untuk menyinkronkan vault dan graf visual Anda"}
          {mode === "register" && "Buat akun untuk mengelola dan mempublikasikan catatan Anda"}
          {mode === "reset" && "Masukkan email Anda untuk menerima instruksi pemulihan"}
          {mode === "update-password" && "Buat kata sandi baru untuk akun Anda"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {mode === "login" && (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  className="pl-9"
                  {...loginForm.register("email")}
                />
              </div>
              {loginForm.formState.errors.email && (
                <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Kata Sandi</Label>
                <button
                  type="button"
                  onClick={() => setMode("reset")}
                  className="text-xs text-primary hover:underline"
                >
                  Lupa kata sandi?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-9"
                  {...loginForm.register("password")}
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Masuk
            </Button>
          </form>
        )}

        {mode === "register" && (
          <AuthRegisterForm
            form={registerForm}
            watchedUsername={watchedUsername}
            isCheckingUsername={isCheckingUsername}
            usernameAvailable={usernameAvailable}
            usernameMessage={usernameMessage}
            showPassword={showPassword}
            onToggleShowPassword={toggleShowPassword}
            isLoading={isLoading}
            onSubmit={handleRegister}
          />
        )}

        {mode === "reset" && (
          <form onSubmit={resetForm.handleSubmit(handleReset)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="nama@email.com"
                  className="pl-9"
                  {...resetForm.register("email")}
                />
              </div>
              {resetForm.formState.errors.email && (
                <p className="text-xs text-destructive">{resetForm.formState.errors.email.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Kirim Tautan Pemulihan
            </Button>
          </form>
        )}

        {mode === "update-password" && (
          <form onSubmit={updatePasswordForm.handleSubmit(handleUpdatePassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Kata Sandi Baru</Label>
              <Input id="new-password" type="password" {...updatePasswordForm.register("password")} />
              <PasswordStrengthIndicator password={updatePasswordForm.watch("password") || ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Konfirmasi Kata Sandi</Label>
              <Input
                id="confirm-password"
                type="password"
                {...updatePasswordForm.register("confirmPassword")}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Perbarui Kata Sandi
            </Button>
          </form>
        )}

        {(mode === "login" || mode === "register") && (
          <>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">atau lanjutkan dengan</span>
              </div>
            </div>

            <Button variant="outline" type="button" className="w-full" onClick={() => signInWithGoogle()}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Google
            </Button>
          </>
        )}
      </CardContent>

      <CardFooter className="flex justify-center">
        {mode === "login" && (
          <p className="text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <button onClick={() => setMode("register")} className="text-primary font-medium hover:underline">
              Daftar
            </button>
          </p>
        )}
        {mode === "register" && (
          <p className="text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <button onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
              Masuk
            </button>
          </p>
        )}
        {(mode === "reset" || mode === "update-password") && (
          <button onClick={() => setMode("login")} className="text-sm text-primary hover:underline">
            Kembali ke halaman masuk
          </button>
        )}
      </CardFooter>
    </Card>
  );
}
