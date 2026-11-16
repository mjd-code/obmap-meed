/**
 * ProfileService - Pengelolaan Identitas Username, Validasi Keunikan,
 * Reservasi Pengalihan 14 Hari, dan Resolusi Namespace Publik.
 */

import { supabase } from "@/global/api/supabaseClient";
import { RESERVED_SLUGS, normalizePublicHandle } from "@/domains/community/shared/utils/reservedSlugs";

export interface UsernameAvailabilityResult {
  available: boolean;
  normalizedUsername: string;
  reason?: string;
}

export interface UsernameResolutionResult {
  userId: string;
  currentUsername: string;
  isRedirect: boolean;
  oldUsername?: string;
}

export interface UsernameRedirectRecord {
  id: string;
  user_id: string;
  old_username: string;
  expires_at: string;
  created_at: string;
}

export interface PublicProfileSummary {
  user_id: string;
  username: string | null;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_public: boolean;
  account_status: string;
}

export interface ActiveRedirectSummary {
  user_id: string;
  old_username: string;
  current_username: string | null;
  expires_at: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isMissingRpcError(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false;
  if (error.code === "PGRST202" || error.code === "42883") return true;
  const msg = error.message || "";
  return /could not find the function|does not exist/i.test(msg);
}

export class ProfileService {
  /**
   * Kata kunci terlarang yang tidak boleh digunakan sebagai username
   * untuk menghindari tabrakan dengan rute internal aplikasi.
   */
  private static readonly RESERVED_USERNAMES = RESERVED_SLUGS;

  /**
   * Mengubah teks bebas menjadi format slug standar.
   */
  static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Validasi format username (panjang 3-30 karakter, alphanumeric, underscore, hyphen).
   */
  static validateUsernameFormat(username: string): { valid: boolean; error?: string; normalized: string } {
    const normalized = normalizePublicHandle(username);

    if (!normalized) {
      return { valid: false, error: "Username tidak boleh kosong", normalized: "" };
    }

    if (normalized.length < 3) {
      return { valid: false, error: "Username minimal 3 karakter", normalized };
    }

    if (normalized.length > 30) {
      return { valid: false, error: "Username maksimal 30 karakter", normalized };
    }

    if (!/^[a-z0-9_-]+$/.test(normalized)) {
      return {
        valid: false,
        error: "Username hanya boleh memuat huruf kecil, angka, underscore (_), atau hyphen (-)",
        normalized,
      };
    }

    if (this.RESERVED_USERNAMES.has(normalized)) {
      return { valid: false, error: `'${normalized}' adalah kata cadangan sistem dan tidak dapat digunakan`, normalized };
    }

    return { valid: true, normalized };
  }

  /**
   * Mengambil ringkasan profil publik (anon-safe, tanpa email/PII) lewat handle (@username/username) atau user_id.
   * Memprioritaskan RPC get_public_profile_by_handle dengan fallback ke query langsung bila RPC belum tersedia.
   */
  private static async fetchPublicProfileInternal(
    handleOrUserId: string
  ): Promise<{ profile: PublicProfileSummary | null; error?: string }> {
    const raw = (handleOrUserId || "").trim();
    if (!raw) return { profile: null };

    const isUuid = UUID_REGEX.test(raw);
    const normalized = isUuid ? raw : normalizePublicHandle(raw);
    if (!normalized) return { profile: null };

    if (typeof supabase.rpc === "function") {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "get_public_profile_by_handle",
        { p_handle: normalized }
      );

      if (!rpcError) {
        const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
        if (!row) return { profile: null };
        return {
          profile: {
            user_id: row.user_id,
            username: row.username ?? null,
            display_name: row.display_name ?? null,
            full_name: row.full_name ?? row.display_name ?? null,
            avatar_url: row.avatar_url ?? null,
            bio: row.bio ?? null,
            is_public: row.is_public ?? true,
            account_status: row.account_status ?? "approved",
          },
        };
      }

      if (!isMissingRpcError(rpcError)) {
        return { profile: null, error: rpcError.message };
      }
    }

    // Fallback untuk database lama atau unit test mock tanpa RPC
    const baseQuery = supabase
      .from("profiles")
      .select("user_id, username, display_name, full_name, avatar_url, bio, is_public, account_status");

    const { data, error } = await (isUuid
      ? baseQuery.eq("user_id", normalized).maybeSingle()
      : baseQuery.ilike("username", normalized).maybeSingle());

    if (!error) {
      if (!data) return { profile: null };
      const row = data as {
        user_id: string;
        username?: string | null;
        display_name?: string | null;
        full_name?: string | null;
        avatar_url?: string | null;
        bio?: string | null;
        is_public?: boolean;
        account_status?: string;
      };
      return {
        profile: {
          user_id: row.user_id,
          username: row.username ?? null,
          display_name: row.display_name ?? null,
          full_name: row.full_name ?? row.display_name ?? null,
          avatar_url: row.avatar_url ?? null,
          bio: row.bio ?? null,
          is_public: typeof row.is_public === "boolean" ? row.is_public : true,
          account_status: row.account_status ?? "approved",
        },
      };
    }

    // Fallback sekunder jika skema profiles belum memiliki kolom full_name / account_status
    if (/column .* does not exist/i.test(error.message || "")) {
      const minQuery = supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url");
      const { data: minData, error: minErr } = await (isUuid
        ? minQuery.eq("user_id", normalized).maybeSingle()
        : minQuery.ilike("username", normalized).maybeSingle());

      if (minErr) {
        return { profile: null, error: minErr.message };
      }
      if (!minData) return { profile: null };
      return {
        profile: {
          user_id: minData.user_id,
          username: minData.username ?? null,
          display_name: minData.display_name ?? null,
          full_name: minData.display_name ?? null,
          avatar_url: minData.avatar_url ?? null,
          bio: null,
          is_public: true,
          account_status: "approved",
        },
      };
    }

    return { profile: null, error: error.message };
  }

  static async getPublicProfileByHandle(
    handleOrUserId: string
  ): Promise<PublicProfileSummary | null> {
    const { profile, error } = await this.fetchPublicProfileInternal(handleOrUserId);
    if (error) {
      console.error("[ProfileService] Error getting public profile:", error);
      return null;
    }
    return profile;
  }

  /**
   * Memeriksa reservasi pengalihan handle lama (14 hari) secara aman via RPC point-lookup.
   */
  private static async lookupActiveRedirectInternal(
    normalizedHandle: string
  ): Promise<{ redirect: ActiveRedirectSummary | null; error?: string }> {
    const clean = normalizePublicHandle(normalizedHandle);
    if (!clean) return { redirect: null };

    if (typeof supabase.rpc === "function") {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "resolve_username_redirect",
        { p_handle: clean }
      );

      if (!rpcError) {
        const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
        if (!row) return { redirect: null };
        return {
          redirect: {
            user_id: row.user_id,
            old_username: row.old_username,
            current_username: row.current_username ?? null,
            expires_at: row.expires_at,
          },
        };
      }

      if (!isMissingRpcError(rpcError)) {
        return { redirect: null, error: rpcError.message };
      }
    }

    const nowIso = new Date().toISOString();
    const { data: redirectMatch, error: redirectErr } = await supabase
      .from("username_redirects")
      .select("user_id, old_username, expires_at")
      .ilike("old_username", clean)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (redirectErr) {
      return { redirect: null, error: redirectErr.message };
    }

    if (!redirectMatch) return { redirect: null };
    return {
      redirect: {
        user_id: redirectMatch.user_id,
        old_username: redirectMatch.old_username,
        current_username: null,
        expires_at: redirectMatch.expires_at,
      },
    };
  }

  static async lookupActiveRedirect(
    normalizedHandle: string
  ): Promise<ActiveRedirectSummary | null> {
    const { redirect, error } = await this.lookupActiveRedirectInternal(normalizedHandle);
    if (error) {
      console.error("[ProfileService] Error checking redirects:", error);
      return null;
    }
    return redirect;
  }

  /**
   * Memeriksa ketersediaan username di database (case-insensitive).
   * Memeriksa profil aktif dan reservasi username_redirects aktif (14 hari).
   */
  static async checkUsernameAvailability(
    candidateUsername: string,
    currentUserId?: string
  ): Promise<UsernameAvailabilityResult> {
    const validation = this.validateUsernameFormat(candidateUsername);
    if (!validation.valid) {
      return {
        available: false,
        normalizedUsername: validation.normalized,
        reason: validation.error,
      };
    }

    const normalized = validation.normalized;

    try {
      // 1. Cek kepemilikan handle via RPC anon-safe (atau fallback)
      const { profile: profileMatch, error: profileErr } =
        await this.fetchPublicProfileInternal(normalized);

      if (profileErr) {
        console.error("[ProfileService] Error checking profiles:", profileErr);
        return { available: false, normalizedUsername: normalized, reason: "Gagal memeriksa database." };
      }

      if (profileMatch) {
        if (currentUserId && profileMatch.user_id === currentUserId) {
          return { available: true, normalizedUsername: normalized };
        }
        return {
          available: false,
          normalizedUsername: normalized,
          reason: "Username ini sudah digunakan oleh akun lain.",
        };
      }

      // 2. Cek reservasi username_redirects aktif (belum 14 hari) via RPC point-lookup
      const { redirect: redirectMatch, error: redirectErr } =
        await this.lookupActiveRedirectInternal(normalized);

      if (redirectErr) {
        console.error("[ProfileService] Error checking redirects:", redirectErr);
        return { available: false, normalizedUsername: normalized, reason: "Gagal memeriksa reservasi pengalihan." };
      }

      if (redirectMatch) {
        if (currentUserId && redirectMatch.user_id === currentUserId) {
          return { available: true, normalizedUsername: normalized };
        }
        return {
          available: false,
          normalizedUsername: normalized,
          reason: "Username ini sedang dalam masa pengalihan cadangan (14 hari) oleh akun lain.",
        };
      }

      return { available: true, normalizedUsername: normalized };
    } catch (err: unknown) {
      return {
        available: false,
        normalizedUsername: normalized,
        reason: err instanceof Error ? err.message : "Terjadi kesalahan koneksi.",
      };
    }
  }

  /**
   * Mengklaim atau memperbarui username pengguna.
   * Otomatis mengaktifkan is_public = true agar langsung dapat diakses publik.
   */
  static async claimOrUpdateUsername(
    userId: string,
    newUsername: string
  ): Promise<{ success: boolean; error?: string }> {
    const availability = await this.checkUsernameAvailability(newUsername, userId);
    if (!availability.available) {
      return { success: false, error: availability.reason || "Username tidak valid atau tidak tersedia." };
    }

    const normalizedNew = availability.normalizedUsername;

    // Ambil username saat ini
    const { data: currentProfile, error: fetchErr } = await supabase
      .from("profiles")
      .select("username")
      .eq("user_id", userId)
      .maybeSingle();

    if (fetchErr) {
      return { success: false, error: "Gagal mengambil data profil saat ini." };
    }

    const oldUsername = currentProfile?.username ? currentProfile.username.trim().toLowerCase() : null;

    // Jika username sama persis, pastikan is_public tetap true
    if (oldUsername === normalizedNew) {
      await supabase
        .from("profiles")
        .update({ is_public: true })
        .eq("user_id", userId);
      return { success: true };
    }

    // Jika ada username lama dan berbeda, catat di username_redirects (14 hari)
    if (oldUsername) {
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const { error: redirectInsertErr } = await supabase
        .from("username_redirects")
        .insert({
          user_id: userId,
          old_username: oldUsername,
          expires_at: expiresAt,
        });

      if (redirectInsertErr) {
        console.warn("[ProfileService] Gagal mencatat username_redirect:", redirectInsertErr);
      }
    }

    // Update kolom username dan pastikan is_public = true di tabel profiles
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({
        username: normalizedNew,
        is_public: true,
      })
      .eq("user_id", userId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    return { success: true };
  }

  /**
   * Menemukan pemilik username untuk kebutuhan routing publik /:username (/@username).
   * Mendukung auto-resolusi ke username baru jika pengunjung mengakses username lama dalam masa 14 hari.
   */
  static async resolveUsernameOrRedirect(inputUsername: string): Promise<UsernameResolutionResult | null> {
    const normalized = normalizePublicHandle(inputUsername);
    if (!normalized || this.RESERVED_USERNAMES.has(normalized)) {
      return null;
    }

    // 1. Cek langsung via RPC anon-safe berdasarkan username
    const directProfile = await this.getPublicProfileByHandle(normalized);

    if (directProfile?.username) {
      return {
        userId: directProfile.user_id,
        currentUsername: directProfile.username,
        isRedirect: false,
      };
    }

    // 2. Cek ke username_redirects yang belum kedaluwarsa (14 hari) via RPC point-lookup
    const redirect = await this.lookupActiveRedirect(normalized);

    if (redirect) {
      const currentUsername =
        redirect.current_username ||
        (await this.getPublicProfileByHandle(redirect.user_id))?.username;

      if (currentUsername) {
        return {
          userId: redirect.user_id,
          currentUsername,
          isRedirect: true,
          oldUsername: redirect.old_username,
        };
      }
    }

    return null;
  }
}
