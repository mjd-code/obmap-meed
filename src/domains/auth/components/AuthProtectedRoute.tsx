import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/domains/auth/shared/hooks/useAuth";
import { isDevAuthEnabled, devQuickLogin } from "@/domains/auth/shared/api/devAuth";
import {
  ReleaseStageService,
  RELEASE_STAGE_LABELS,
} from "@/domains/auth/shared/api/ReleaseStageService";
import { supabase } from "@/global/api/supabaseClient";
import type { ReleaseStage } from "@/types/collaboration";
import { Badge } from "@/global/ui/badge";
import { Button } from "@/global/ui/button";
import { Input } from "@/global/ui/input";
import { Loader2, ShieldAlert, Clock, KeyRound, LogOut, RefreshCw } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const [attemptedAutoLogin, setAttemptedAutoLogin] = useState(false);
  const [activeStage, setActiveStage] = useState<ReleaseStage>("stage_1_partner");
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [gateChecked, setGateChecked] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    const isManualLogout = sessionStorage.getItem("dev_manual_logout") === "true";

    // Jika di development, belum ada user, dan bukan karena sengaja klik logout
    if (!loading && !user && isDevAuthEnabled && !isManualLogout && !attemptedAutoLogin) {
      setIsAutoLoggingIn(true);
      setAttemptedAutoLogin(true);
      devQuickLogin()
        .catch((err) => console.warn("Auto dev login failed:", err))
        .finally(() => setIsAutoLoggingIn(false));
    }
  }, [loading, user, attemptedAutoLogin]);

  useEffect(() => {
    let active = true;
    async function inspectGate() {
      if (!user) {
        if (active) setGateChecked(true);
        return;
      }
      const [stage, roleRes] = await Promise.all([
        ReleaseStageService.getActiveStage(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "superadmin")
          .maybeSingle(),
      ]);
      if (!active) return;
      setActiveStage(stage);
      setIsSuperadmin(Boolean(roleRes.data));
      setGateChecked(true);
    }
    void inspectGate();
    return () => {
      active = false;
    };
  }, [user]);

  if (loading || isAutoLoggingIn || (user && !gateChecked)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {isAutoLoggingIn && (
          <p className="text-xs text-muted-foreground animate-pulse font-mono">
            Auto-authenticating dev workspace...
          </p>
        )}
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const gate = isDevAuthEnabled
    ? { allowed: true as const }
    : ReleaseStageService.canAccessWorkspaceByStage({
        stage: activeStage,
        accountStatus: profile?.account_status ?? "approved",
        isSuperadmin,
      });

  if (!gate.allowed) {
    const isSuspended = gate.reason === "suspended";

    const handleRedeem = async (e: React.FormEvent) => {
      e.preventDefault();
      setRedeeming(true);
      const res = await ReleaseStageService.validateAndRedeemInviteCode(
        inviteCode,
        user.id,
        user.email
      );
      setRedeeming(false);
      if (!res.success) {
        toast.error(res.error || "Kode undangan tidak valid.");
        return;
      }
      toast.success("Akun Anda telah diaktivasi!");
      await refreshProfile();
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full rounded-xl border border-border bg-card p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="text-[11px] font-mono">
              {RELEASE_STAGE_LABELS[activeStage]}
            </Badge>
            <Badge variant={isSuspended ? "destructive" : "secondary"} className="text-[11px]">
              {isSuspended ? "Suspended" : "Pending Approval"}
            </Badge>
          </div>

          <div className="flex items-start gap-3">
            {isSuspended ? (
              <ShieldAlert className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
            ) : (
              <Clock className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h1 className="text-base font-semibold text-foreground">
                {isSuspended
                  ? "Akun Ditangguhkan"
                  : "Menunggu Persetujuan Admin Kurator"}
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isSuspended
                  ? "Akses workspace Anda sedang ditangguhkan oleh administrator platform."
                  : activeStage === "stage_1_partner"
                  ? "ObMap saat ini berada di fase Closed Partner Pilot. Masukkan kode undangan mitra atau tunggu persetujuan manual administrator di panel kurator."
                  : "Pendaftaran komunitas Anda masuk ke antrean persetujuan individual administrator untuk menjaga kualitas trafik dan kurasi."}
              </p>
            </div>
          </div>

          {!isSuspended && (
            <form onSubmit={handleRedeem} className="space-y-2 pt-1">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-primary" />
                Punya Kode Undangan Mitra?
              </label>
              <div className="flex gap-2">
                <Input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="OBMAP-XXXXXXXX"
                  className="h-9 text-xs font-mono uppercase"
                />
                <Button type="submit" size="sm" disabled={redeeming || !inviteCode.trim()}>
                  {redeeming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Aktifkan"}
                </Button>
              </div>
            </form>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => void refreshProfile()}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Cek Status
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={() => void signOut()}
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
