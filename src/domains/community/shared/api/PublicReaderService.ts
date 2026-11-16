/**
 * PublicReaderService
 *
 * Mengelola pembacaan data publik (anon-safe) untuk portal terstruktur:
 * /:username/:vaultSlug/:noteSlug (mendukung handle /@:username dan /:username)
 *
 * Dilengkapi Reserved Slug Guard, 14-day redirect resolution, dan Smart UUID Interceptor.
 */

import { supabase } from "@/global/api/supabaseClient";
import { ProfileService } from "@/domains/settings/shared/api/ProfileService";
import { isReservedSlug, normalizePublicHandle } from "@/domains/community/shared/utils/reservedSlugs";
import {
  DEFAULT_PUBLIC_LICENSE,
  isNoteExcludedFromPublic,
} from "@/domains/auth/shared/api/policyEngine";
import type { NoteRecord, VaultMemberRole, VaultVisibility } from "@/types/collaboration";
import type { GraphData, Node, Link } from "@/domains/graph/shared/utils/graph.types";

export interface PublicVaultOwnerInfo {
  userId: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface PublicVaultInfo {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string | null;
  visibility?: VaultVisibility;
  defaultLicense?: string;
  owner: PublicVaultOwnerInfo;
}

export interface ResolvePublicRouteResult {
  status: "success" | "redirect" | "not_found";
  redirectUrl?: string;
  vault?: PublicVaultInfo;
  notes?: NoteRecord[];
  activeNote?: NoteRecord;
  graph?: GraphData;
  errorReason?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class PublicReaderService {
  /**
   * Mengubah teks menjadi slug standar yang konsisten.
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
   * Helper pembuat URL profil kanonikal (/:username atau /@username).
   */
  static buildProfileUrl(username: string, withAtPrefix = false): string {
    const cleanUser = normalizePublicHandle(username);
    return `/${withAtPrefix ? "@" : ""}${cleanUser}`;
  }

  /**
   * Helper pembuat URL publik yang konsisten di seluruh aplikasi:
   * /:username/:vaultSlug/:noteSlug
   */
  static buildPublicUrl(username: string, vaultSlugOrName: string, noteSlug?: string): string {
    const cleanUser = normalizePublicHandle(username);
    const cleanVault = this.slugify(vaultSlugOrName);
    const cleanNote = noteSlug ? `/${this.slugify(noteSlug)}` : "";
    return `/${cleanUser}/${cleanVault}${cleanNote}`;
  }

  /**
   * Resolusi penuh rute publik /:username/:vaultSlug/:noteSlug (/@username/...):
   * 1. Tolak RESERVED_SLUGS sebelum query DB (hard cutover /p/* juga tertolak di sini)
   * 2. Deteksi apakah parameter pertama adalah Vault UUID (Smart UUID Interceptor)
   * 3. Resolusi Username / Redirect 14 Hari
   * 4. Resolusi Vault spesifik milik user tersebut
   * 5. Resolusi Catatan Terbit & Graf Interaktif
   */
  static async resolvePublicRoute(
    param1: string,
    param2?: string,
    param3?: string
  ): Promise<ResolvePublicRouteResult> {
    const rawParam1 = (param1 || "").trim();
    const cleanParam2 = (param2 || "").trim();
    const cleanParam3 = (param3 || "").trim();
    const normalizedParam1 = normalizePublicHandle(rawParam1);

    // ------------------------------------------------------------------
    // 1. SMART INTERCEPTOR: Jika param1 adalah UUID (/:vaultId/:noteSlug)
    // ------------------------------------------------------------------
    if (UUID_REGEX.test(rawParam1)) {
      const { data: legacyVault } = await supabase
        .from("user_vaults")
        .select("id, user_id, name, description")
        .eq("id", rawParam1)
        .maybeSingle();

      if (!legacyVault) {
        return {
          status: "not_found",
          errorReason: `Vault dengan ID '${rawParam1}' tidak ditemukan atau bersifat privat.`,
        };
      }

      const ownerProfile = await ProfileService.getPublicProfileByHandle(legacyVault.user_id);

      const ownerUsername = ownerProfile?.username;
      const canonicalVaultSlug = this.slugify(legacyVault.name);
      const noteSlug = cleanParam2 || cleanParam3;
      const notePart = noteSlug ? `/${this.slugify(noteSlug)}` : "";

      if (ownerUsername) {
        return {
          status: "redirect",
          redirectUrl: `/${normalizePublicHandle(ownerUsername)}/${canonicalVaultSlug}${notePart}`,
        };
      }
    }

    // ------------------------------------------------------------------
    // 2. RESERVED SLUG GUARD: Blokir semua rute sistem & legacy /p/*
    // ------------------------------------------------------------------
    if (!normalizedParam1 || isReservedSlug(normalizedParam1)) {
      return {
        status: "not_found",
        errorReason: "Halaman tidak ditemukan.",
      };
    }

    // ------------------------------------------------------------------
    // 3. RUTE KANONIKAL: /:username/:vaultSlug/:noteSlug
    // ------------------------------------------------------------------
    const usernameParam = normalizedParam1;
    const vaultSlugParam = this.slugify(cleanParam2);
    const noteSlugParam = cleanParam3 ? this.slugify(cleanParam3) : undefined;

    // Resolusi Username & Deteksi Pengalihan Cadangan 14 Hari
    const userResolution = await ProfileService.resolveUsernameOrRedirect(usernameParam);

    if (!userResolution) {
      return {
        status: "not_found",
        errorReason: `Penulis dengan username '@${usernameParam}' tidak ditemukan.`,
      };
    }

    // Jika username dalam masa pengalihan 14 hari atau handle menggunakan prefix '@' yang beda
    if (userResolution.isRedirect && userResolution.currentUsername !== usernameParam) {
      const targetVault = vaultSlugParam ? `/${vaultSlugParam}` : "";
      const targetNote = vaultSlugParam && noteSlugParam ? `/${noteSlugParam}` : "";
      return {
        status: "redirect",
        redirectUrl: `/${userResolution.currentUsername}${targetVault}${targetNote}`,
      };
    }

    // Ambil data profil penulis + status akun (ADR-0009: akun pending_approval / suspended tidak tampil publik)
    const profileData = await ProfileService.getPublicProfileByHandle(userResolution.userId);

    if (
      profileData?.account_status === "pending_approval" ||
      profileData?.account_status === "suspended"
    ) {
      return {
        status: "not_found",
        errorReason: `Profil publik '@${userResolution.currentUsername}' belum diaktivasi atau sedang ditangguhkan.`,
      };
    }

    const ownerInfo: PublicVaultOwnerInfo = {
      userId: userResolution.userId,
      username: userResolution.currentUsername,
      fullName: profileData?.full_name || profileData?.display_name || null,
      avatarUrl: profileData?.avatar_url || null,
    };

    // Resolusi Vault scoped ke user_id pemilik (dengan fallback bila kolom visibility belum tersedia)
    type VaultRow = {
      id: string;
      user_id: string;
      name: string;
      description: string | null;
      visibility?: string;
      default_license?: string;
    };

    let userVaults: VaultRow[] = [];
    const { data: vaultsWithMeta, error: vaultErr } = await supabase
      .from("user_vaults")
      .select("id, user_id, name, description, visibility, default_license")
      .eq("user_id", userResolution.userId);

    if (vaultErr) {
      const { data: fallbackVaults, error: fallbackErr } = await supabase
        .from("user_vaults")
        .select("id, user_id, name, description")
        .eq("user_id", userResolution.userId);

      if (!fallbackErr && fallbackVaults) {
        userVaults = fallbackVaults;
      }
    } else if (vaultsWithMeta) {
      userVaults = vaultsWithMeta;
    }

    if (userVaults.length === 0) {
      if (!vaultSlugParam) {
        return {
          status: "success",
          vault: {
            id: `profile-${userResolution.userId}`,
            ownerId: userResolution.userId,
            name: ownerInfo.fullName || `@${ownerInfo.username}`,
            slug: "utama",
            description: profileData?.bio || null,
            visibility: "public_listed",
            defaultLicense: DEFAULT_PUBLIC_LICENSE,
            owner: ownerInfo,
          },
          notes: [],
          activeNote: undefined,
          graph: { nodes: [], links: [] },
        };
      }

      return {
        status: "not_found",
        errorReason: `Tidak ada vault yang ditemukan untuk penulis '@${userResolution.currentUsername}'.`,
      };
    }

    let matchedVault: VaultRow | undefined = undefined;

    if (!vaultSlugParam) {
      const publishedVaultIds = new Set<string>();
      try {
        const vaultIds = userVaults.map((v) => v.id);
        const { data: publishedMeta } = await supabase
          .from("notes")
          .select("vault_id")
          .in("vault_id", vaultIds)
          .eq("status", "published")
          .limit(50);

        if (Array.isArray(publishedMeta)) {
          for (const row of publishedMeta) {
            if (row?.vault_id) publishedVaultIds.add(row.vault_id);
          }
        }
      } catch {
        // Fallback aman bila mock tidak mendukung filter .in()
      }

      matchedVault =
        userVaults.find(
          (v) =>
            publishedVaultIds.has(v.id) &&
            (v.visibility === "public_listed" || v.visibility === "public_unlisted")
        ) ??
        userVaults.find((v) => publishedVaultIds.has(v.id)) ??
        userVaults.find(
          (v) => v.visibility === "public_listed" || v.visibility === "public_unlisted"
        ) ??
        userVaults[0];
    } else {
      matchedVault = userVaults.find((v) => {
        const vSlug = this.slugify(v.name);
        return vSlug === vaultSlugParam || v.id.toLowerCase() === vaultSlugParam;
      });
    }

    if (!matchedVault) {
      return {
        status: "not_found",
        errorReason: `Vault '${cleanParam2}' tidak ditemukan pada akun @${userResolution.currentUsername}.`,
      };
    }

    const resolvedVisibility =
      (matchedVault.visibility as VaultVisibility | undefined) ?? "private";

    // Ambil Catatan Terbit & Visual Graf Publik lebih dulu agar vault dengan catatan terbit tetap dapat diakses
    const [notes, graph] = await Promise.all([
      this.getPublishedNotes(matchedVault.id),
      this.getPublishedGraph(matchedVault.id),
    ]);

    const hasPublicContent =
      resolvedVisibility === "public_listed" ||
      resolvedVisibility === "public_unlisted" ||
      notes.length > 0;

    if (!hasPublicContent && vaultSlugParam) {
      return {
        status: "not_found",
        errorReason: `Vault '${matchedVault.name}' bersifat privat atau memerlukan tautan undangan khusus.`,
      };
    }

    // Jika rute root /:username belum memiliki vault publik maupun catatan terbit,
    // tampilkan profil cendekiawan kosong tanpa membocorkan nama vault privat.
    const exposeVaultMeta = hasPublicContent;
    const canonicalVaultSlug = exposeVaultMeta ? this.slugify(matchedVault.name) : "utama";

    const vaultInfo: PublicVaultInfo = {
      id: exposeVaultMeta ? matchedVault.id : `profile-${userResolution.userId}`,
      ownerId: matchedVault.user_id,
      name: exposeVaultMeta ? matchedVault.name : ownerInfo.fullName || `@${ownerInfo.username}`,
      slug: canonicalVaultSlug,
      description: exposeVaultMeta ? matchedVault.description : profileData?.bio || null,
      visibility: exposeVaultMeta ? resolvedVisibility : "public_listed",
      defaultLicense: matchedVault.default_license || DEFAULT_PUBLIC_LICENSE,
      owner: ownerInfo,
    };

    let activeNote: NoteRecord | undefined = undefined;

    if (notes.length > 0) {
      if (noteSlugParam) {
        activeNote = notes.find((n) => n.slug === noteSlugParam) || notes[0];
      } else {
        activeNote = notes[0];
      }
    }

    // Jika pengunjung membuka /:username tanpa spesifikasi vault,
    // arahkan otomatis ke alamat kanonikal lengkap bila ada catatan terbit
    if (!cleanParam2 && activeNote) {
      return {
        status: "redirect",
        redirectUrl: `/${userResolution.currentUsername}/${canonicalVaultSlug}/${activeNote.slug}`,
      };
    }

    return {
      status: "success",
      vault: vaultInfo,
      notes,
      activeNote,
      graph,
    };
  }

  /**
   * Mengambil semua catatan berstatus 'published' dalam vault tertentu,
   * sekaligus mengecualikan catatan dengan frontmatter `visibility: private`.
   */
  static async getPublishedNotes(vaultId: string): Promise<NoteRecord[]> {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("vault_id", vaultId)
      .eq("status", "published")
      .order("title", { ascending: true });

    if (error) {
      console.error("[PublicReaderService] Gagal memuat catatan terbit:", error);
      return [];
    }

    return ((data as NoteRecord[]) || []).filter(
      (note) => !isNoteExcludedFromPublic(note.frontmatter)
    );
  }

  /** Reads 4-state visibility and default license metadata for a vault. */
  static async getVaultVisibility(
    vaultId: string
  ): Promise<{ visibility: VaultVisibility; defaultLicense: string }> {
    const { data } = await supabase
      .from("user_vaults")
      .select("visibility, default_license")
      .eq("id", vaultId)
      .maybeSingle();

    return {
      visibility: (data?.visibility as VaultVisibility | undefined) ?? "private",
      defaultLicense: data?.default_license || DEFAULT_PUBLIC_LICENSE,
    };
  }

  /** Updates 4-state vault visibility and optional default public license. */
  static async updateVaultVisibility(
    vaultId: string,
    visibility: VaultVisibility,
    defaultLicense?: string
  ): Promise<boolean> {
    const patch: {
      visibility: VaultVisibility;
      default_license?: string;
      updated_at: string;
    } = {
      visibility,
      updated_at: new Date().toISOString(),
    };
    if (defaultLicense) {
      patch.default_license = defaultLicense;
    }

    const { error } = await supabase
      .from("user_vaults")
      .update(patch)
      .eq("id", vaultId);

    return !error;
  }

  /** Creates a revocable share link token for `shared` vaults/notes. */
  static async createShareLink(
    vaultId: string,
    noteId: string | null,
    role: VaultMemberRole,
    createdBy: string,
    expiresInHours = 168
  ): Promise<{ token: string } | null> {
    const rawToken = crypto.randomUUID().replace(/-/g, "");
    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000).toISOString();

    const { error } = await supabase.from("share_links").insert({
      vault_id: vaultId,
      note_id: noteId,
      token_hash: rawToken,
      role,
      expires_at: expiresAt,
      created_by: createdBy,
    });

    if (error) return null;
    return { token: rawToken };
  }

  /**
   * Menghasilkan data graf publik (node & relasi hierarkis + wikilink) yang lengkap.
   */
  static async getPublishedGraph(vaultId: string): Promise<GraphData> {
    const notes = await this.getPublishedNotes(vaultId);
    if (notes.length === 0) {
      return { nodes: [], links: [] };
    }

    const idToNodeMap = new Map<string, Node>();
    const titleToIdMap = new Map<string, string>();
    const slugToIdMap = new Map<string, string>();
    const localIdToDbIdMap = new Map<string, string>();

    const nodes: Node[] = notes.map((note) => {
      const fm = (note.frontmatter as Record<string, any>) || {};
      const isFolder = fm.type === "folder" || fm.is_folder === true;
      const cleanSlug = this.slugify(note.slug || note.title);

      const nodeObj: Node = {
        id: note.id,
        name: note.title,
        content: note.content || "",
        type: isFolder ? ("folder" as const) : ("file" as const),
        parentId: fm.parentId || null,
        depth: typeof fm.depth === "number" ? fm.depth : isFolder ? 0 : 1,
        tags: Array.isArray(fm.tags) ? fm.tags : [],
      };

      idToNodeMap.set(note.id, nodeObj);
      titleToIdMap.set(note.title.trim().toLowerCase(), note.id);
      slugToIdMap.set(cleanSlug, note.id);
      if (fm.local_node_id) {
        localIdToDbIdMap.set(fm.local_node_id, note.id);
      }

      return nodeObj;
    });

    const links: Link[] = [];
    const linkSet = new Set<string>();

    const addLink = (source: string, target: string, type: "hierarchy" | "backlink") => {
      if (!source || !target || source === target) return;
      if (!idToNodeMap.has(source) || !idToNodeMap.has(target)) return;

      const key = `${source}->${target}`;
      if (!linkSet.has(key)) {
        linkSet.add(key);
        links.push({ source, target, type });
      }
    };

    for (const n of nodes) {
      if (n.parentId) {
        const parentDbId = localIdToDbIdMap.get(n.parentId) || n.parentId;
        if (idToNodeMap.has(parentDbId)) {
          addLink(parentDbId, n.id, "hierarchy");
        }
      }
    }

    const wikilinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

    for (const note of notes) {
      if (!note.content) continue;

      let match: RegExpExecArray | null;
      while ((match = wikilinkRegex.exec(note.content)) !== null) {
        const rawTarget = match[1]?.trim();
        if (!rawTarget) continue;

        const targetByTitle = titleToIdMap.get(rawTarget.toLowerCase());
        const targetBySlug = slugToIdMap.get(this.slugify(rawTarget));
        const targetId = targetByTitle || targetBySlug;

        if (targetId && targetId !== note.id) {
          addLink(note.id, targetId, "backlink");
        }
      }
    }

    const folderNodes = nodes.filter((n) => n.type === "folder");
    if (folderNodes.length > 0 && links.length === 0) {
      for (const fileNode of nodes) {
        if (fileNode.type === "file") {
          addLink(folderNodes[0].id, fileNode.id, "hierarchy");
        }
      }
    }

    return { nodes, links };
  }
}
