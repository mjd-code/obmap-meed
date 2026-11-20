import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  INITIAL_ACTIVE_SESSIONS,
  INITIAL_PERSONAL_ACCESS_TOKENS,
} from "../mockAccountSecurityData";
import { PROTOTYPE_SCHOLAR_PROFILE } from "../mockProfileData";
import type {
  AccountProfileFormErrors,
  PasswordStrengthResult,
  PrototypeApiToken,
  PrototypeSessionItem,
  PrototypeSocialLink,
  SocialLinkPlatform,
} from "../settingsTypes";
import type { PrototypeScholarProfile } from "../types";
import type { PrototypeAccountState } from "./prototypeStateTypes";

const ORCID_REGEX = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
const HANDLE_REGEX = /^@?[a-z0-9._-]{3,32}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function evaluatePasswordStrengthPure(password: string): PasswordStrengthResult {
  const checks = {
    minLength: password.length >= 10,
    hasUpperLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSymbol: /[^a-zA-Z0-9]/.test(password),
  };
  const scoreNum = Object.values(checks).filter(Boolean).length as 0 | 1 | 2 | 3 | 4;
  const labels: Record<0 | 1 | 2 | 3 | 4, PasswordStrengthResult["label"]> = {
    0: "Sangat Lemah",
    1: "Lemah",
    2: "Cukup",
    3: "Kuat",
    4: "Sangat Kuat",
  };
  return { score: scoreNum, label: labels[scoreNum], checks };
}

export function validateProfileDraft(
  draft: Pick<PrototypeScholarProfile, "name" | "handle" | "orcid" | "bio">
): AccountProfileFormErrors {
  const errors: AccountProfileFormErrors = {};
  if (!draft.name.trim() || draft.name.trim().length < 2) {
    errors.name = "Nama lengkap minimal 2 karakter.";
  }
  if (!HANDLE_REGEX.test(draft.handle.trim())) {
    errors.handle = "Handle kanonik hanya huruf, angka, titik, atau underscore (3–32 karakter).";
  }
  if (draft.orcid.trim() && !ORCID_REGEX.test(draft.orcid.trim())) {
    errors.orcid = "Format ORCID harus 0000-0000-0000-0000.";
  }
  if (draft.bio.trim().length > 280) {
    errors.bio = "Bio maksimal 280 karakter.";
  }
  return errors;
}

export function useAccountState(): PrototypeAccountState {
  const [profile, setProfile] = useState<PrototypeScholarProfile>(() =>
    structuredClone(PROTOTYPE_SCHOLAR_PROFILE)
  );
  const [profileErrors, setProfileErrors] = useState<AccountProfileFormErrors>({});
  const [email, setEmail] = useState(PROTOTYPE_SCHOLAR_PROFILE.email);
  const [lastPasswordUpdated, setLastPasswordUpdated] = useState("14 hari lalu");
  const [pats, setPats] = useState<PrototypeApiToken[]>(INITIAL_PERSONAL_ACCESS_TOKENS);
  const [sessions, setSessions] = useState<PrototypeSessionItem[]>(INITIAL_ACTIVE_SESSIONS);

  const updateProfile = useCallback(
    (
      patch: Partial<
        Pick<
          PrototypeScholarProfile,
          "name" | "handle" | "bio" | "affiliation" | "orcid" | "location"
        >
      >
    ) => {
      const candidate = { ...profile, ...patch };
      if (patch.handle && !candidate.handle.startsWith("@")) {
        candidate.handle = `@${candidate.handle}`;
      }
      const errors = validateProfileDraft(candidate);
      setProfileErrors(errors);
      if (Object.keys(errors).length > 0) {
        toast.error("Periksa kembali kolom profil yang belum valid.");
        return false;
      }
      setProfile(candidate);
      toast.success("Profil kanonik berhasil diperbarui.");
      return true;
    },
    [profile]
  );

  const addSocialLink = useCallback(
    (platform: SocialLinkPlatform, label: string, url: string) => {
      const cleanUrl = url.trim();
      if (!/^https?:\/\//i.test(cleanUrl)) {
        toast.error("URL tautan sosial/akademik wajib diawali http:// atau https://.");
        return false;
      }
      const newLink: PrototypeSocialLink = {
        id: `soc-${Date.now()}`,
        platform,
        label: label.trim() || platform.toUpperCase(),
        url: cleanUrl,
      };
      setProfile((prev) => ({ ...prev, socialLinks: [...prev.socialLinks, newLink] }));
      toast.success(`Tautan ${newLink.label} ditambahkan.`);
      return true;
    },
    []
  );

  const updateSocialLink = useCallback(
    (id: string, patch: Partial<Omit<PrototypeSocialLink, "id">>) => {
      setProfile((prev) => ({
        ...prev,
        socialLinks: prev.socialLinks.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      }));
    },
    []
  );

  const removeSocialLink = useCallback((id: string) => {
    setProfile((prev) => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((item) => item.id !== id),
    }));
    toast.info("Tautan sosial dihapus.");
  }, []);

  const resetEmail = useCallback((nextEmail: string) => {
    const clean = nextEmail.trim();
    if (!EMAIL_REGEX.test(clean)) {
      toast.error("Format email tidak valid.");
      return false;
    }
    setEmail(clean);
    setProfile((prev) => ({ ...prev, email: clean }));
    toast.success(`Email akun diperbarui ke ${clean} (simulasi lokal).`);
    return true;
  }, []);

  const resetPassword = useCallback((current: string, next: string, confirm: string) => {
    if (!current.trim()) {
      toast.error("Masukkan kata sandi saat ini.");
      return false;
    }
    const strength = evaluatePasswordStrengthPure(next);
    if (strength.score < 3) {
      toast.error("Kata sandi baru terlalu lemah (minimal skor Kuat).");
      return false;
    }
    if (next !== confirm) {
      toast.error("Konfirmasi kata sandi baru tidak cocok.");
      return false;
    }
    setLastPasswordUpdated("Baru saja");
    toast.success("Kata sandi berhasil diperbarui.");
    return true;
  }, []);

  const createPat = useCallback((name: string, scopes: string[]) => {
    const clean = name.trim();
    if (!clean) {
      toast.error("Nama Personal Access Token tidak boleh kosong.");
      return null;
    }
    const token: PrototypeApiToken = {
      id: `pat-${Date.now()}`,
      name: clean,
      prefix: `obm_live_${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
      scopes: scopes.length > 0 ? scopes : ["vault:read"],
      createdAt: "Baru saja",
      lastUsed: "Belum dipakai",
    };
    setPats((prev) => [token, ...prev]);
    toast.success(`PAT "${clean}" dibuat.`);
    return token;
  }, []);

  const revokePat = useCallback((id: string) => {
    setPats((prev) => prev.filter((p) => p.id !== id));
    toast.info("Token akses dicabut.");
  }, []);

  const resetCredentials = useCallback(() => {
    setPats(INITIAL_PERSONAL_ACCESS_TOKENS);
    setLastPasswordUpdated("Direset ke baseline lokal");
    toast.info("Kredensial & PAT direset ke status demo aman.");
  }, []);

  const revokeSession = useCallback((id: string) => {
    const target = sessions.find((s) => s.id === id);
    if (!target || target.isCurrent) {
      toast.warning("Sesi aktif saat ini tidak dapat dicabut dari sini.");
      return false;
    }
    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast.success(`Sesi "${target.device}" dicabut.`);
    return true;
  }, [sessions]);

  const revokeAllOtherSessions = useCallback(() => {
    const revokedCount = sessions.filter((s) => !s.isCurrent).length;
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    toast.success(`${revokedCount} sesi perangkat lain berhasil dicabut.`);
    return revokedCount;
  }, [sessions]);

  return {
    profile,
    profileErrors,
    updateProfile,
    addSocialLink,
    updateSocialLink,
    removeSocialLink,
    email,
    lastPasswordUpdated,
    evaluatePasswordStrength: evaluatePasswordStrengthPure,
    resetEmail,
    resetPassword,
    pats,
    createPat,
    revokePat,
    resetCredentials,
    sessions,
    revokeSession,
    revokeAllOtherSessions,
  };
}
