---
id: DOC-ARCH-ADR-0013
title: ADR-0013 — Infrastruktur Teknis Brand-Agnostic, Dynamic Brand Registry & Engine Auto-Rebranding Aman
type: adr
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 2.1.0
last_reviewed: 2026-11-20
audience: engineering
related:
  - DOC-ARCH-ADR-0004
  - DOC-ARCH-ADR-0009
  - DOC-ARCH-ADR-0011
  - DOC-ARCH-004
  - DOC-ENG-001
  - DOC-ENG-006
source_of_truth: src/global/config/brand.config.ts, src/global/utils/storageKeyMigrator.ts, scripts/rebrand.ts
---

# ADR-0013: Infrastruktur Teknis *Brand-Agnostic*, Dynamic Brand Registry & Auto-Rebranding Engine

## Ringkasan 3 Baris
- Memisahkan **Lapisan Identitas Merek** (nama produk, tagline, domain, logo, meta HTML, nama paket SDK) dari **Lapisan Infrastruktur Teknis** (skema DB, *IndexedDB*, `localStorage`, CSS scope, dan *sidecar directory*) agar rebranding penuh maupun *white-labeling* dapat dilakukan tanpa migrasi database atau hilangnya sesi lokal pengguna.
- Menetapkan arsitektur **4-Lapis Dynamic Branding & Rebranding** (`brand.config.ts` + *Vite HTML injection*, runtime `useBrandConfig()`, adaptor migrasi `storageKeyMigrator.ts` yang kompatibel mundur, serta CLI aman `scripts/rebrand.ts`).
- Menuntaskan drift identitas aktual repositori (`DRFT-017`: `index.html` masih `VaultGraph`, `package.json` `vite_react_shadcn_ts`, UI `ObMap`, dan storage `ObmapConfigDB` / `obmap-*`) melalui langkah terdedikasi **`BRAND-STEP-01`**.

---

## 1. Status & Konteks Masalah
- **Status:** Accepted (Dikunci 2026-11-16 — Implementasi di **`BRAND-STEP-01`** paralel dengan `STEP-02.1` dan `UI-STEP-01`).
- **Konteks (`DRFT-017`):**
  1. Nama awal `"ObMap"` lahir secara spontan sebagai *codename* dan masih tertanam di komponen UI (`Landing.tsx`, `AuthView.tsx`, `AppPreloaderScreen.tsx`, `PublicReader.tsx`, `Admin.tsx`) maupun berbagai kunci infrastruktur browser (`ObmapConfigDB` di `LocalConfigStore.ts`, `obmap-device-id` di `ConfigService.ts`, `obmap-config:` di `LocalConfigStore.ts`, `obmap-vault-schema` di `useSchemaStore.ts`, `obmap.activeVaultId` di `VaultManager.ts`, `.obmap-themed-root` di `useThemeStore.ts`, serta folder `.obmap/`).
  2. Di sisi lain, `index.html` masih menyimpan judul `VaultGraph - Knowledge Network Manager` dan `package.json` masih bernama `vite_react_shadcn_ts`.
  3. Mengubah seluruh kemunculan kata `obmap` secara *blind find-and-replace* berisiko fatal: **mereset preferensi & sesi lokal pengguna** (`IndexedDB`/`localStorage`), merusak tema & CSS *snippet* tersimpan, mengubah arsip historis dokumentasi, serta menyentuh berkas migrasi SQL yang sudah dikunci.

---

## 2. Keputusan Arsitektur Terkunci (`BRAND-STEP-01`)

### 2.1 Lapis 1 — Single Source of Truth `brand.config.ts` & Build-Time Injection
1. Seluruh identitas merek dipusatkan di `src/global/config/brand.config.ts` yang mengekspor kontrak `BrandManifest`:
   - `id`, `name`, `shortName`, `slug`, `tagline`, `description`, `domain`, `canonicalOrigin`, `sdkPackageName` (kanonik `@app/sdk`, adaptif ke brand), `vaultConfigDir` (standar arsitektural `.app` menuju `.app/config.json`, fallback pembacaan `.vk` & `.obmap`), `storagePrefix` (kanonik netral), `themeColor`, dan `assets` (`logoSvg`, `faviconIco`, `appleTouchIcon`, `ogImage`).
2. Mendukung override build-time via variabel lingkungan `VITE_BRAND_*` (`VITE_BRAND_NAME`, `VITE_BRAND_SLUG`, `VITE_BRAND_DOMAIN`, `VITE_BRAND_TAGLINE`, `VITE_BRAND_THEME_COLOR`) untuk membangun varian lingkungan atau *white-label build* tanpa mengubah kode sumber.
3. Plugin `viteBrandHtmlPlugin` di `vite.config.ts` menyuntikkan placeholder `index.html` (`<title>`, meta `description`, OpenGraph, Twitter Card, `apple-mobile-web-app-title`, `application-name`, `<link rel="canonical">`, dan `theme-color`) secara otomatis saat dev server dan production build.

### 2.2 Lapis 2 — Runtime Dynamic & White-Label Institutional Branding (`useBrandConfig()`)
1. UI React membaca identitas produk secara reaktif lewat hook `useBrandConfig()` (bukan string literal `"ObMap"` di JSX).
2. Terintegrasi dengan `ADR-0011` Lapis 2 (*Org / Institution Policy*) dan `platform_settings`:
   - Superadmin (`/admin`) maupun Admin Teamspace Academic/Enterprise (`STEP-04.2`) dapat mengatur *white-label override* saat runtime (nama portal, logo organisasi via `createSignedUrl`, domain kustom, serta visibilitas badge `"Powered by ..."`), tanpa perlu build ulang SPA.
   - Urutan resolusi runtime: `Static BrandManifest` → `VITE_BRAND_* Env` → `Platform Setting Override` → `Org / Teamspace White-Label Policy`.

### 2.3 Lapis 3 — Infrastruktur *Brand-Agnostic* & Migrasi Zero-Loss (`storageKeyMigrator.ts`)
Seluruh infrastruktur teknis **dilarang** memakai nama merek marketing dan wajib menggunakan namespace domain netral ber-prefix **`vk`** (*Visual Knowledge*), disertai adaptor kompatibilitas mundur:

| Lapisan Teknis | Namespace Kanonik (*Brand-Agnostic*) | Fallback / Legacy Reader (`ADR-0013`) | Aturan Kompatibilitas |
| :--- | :--- | :--- | :--- |
| **PostgreSQL & Buckets** | `vaults`, `notes`, `profiles`, `vault-media`, `avatars` | — *(sudah netral)* | Skema SQL & nama bucket **tidak pernah** memuat nama brand. |
| **IndexedDB (`LocalConfigStore.ts`)** | `VkConfigDB` | `ObmapConfigDB` | `storageKeyMigrator.ts` menyalin entri dari `ObmapConfigDB` ke `VkConfigDB` saat inisialisasi pertama bila `VkConfigDB` kosong. |
| **`localStorage` Keys** | `vk-device-id`, `vk-config:`, `vk-vault-schema`, `vk.activeVaultId` | `obmap-device-id`, `obmap-config:`, `obmap-vault-schema`, `obmap.activeVaultId` | Baca dari kunci kanonik; jika belum ada, baca kunci legacy lalu tulis ke kunci kanonik tanpa menghapus data user. |
| **Vault Sidecar (`VaultConfigFile.ts`, `mindmapLayoutManifest.ts`)** | **`.app/config.json`** (single central config) | `.vk/config.json`, `.vk/mindmap-layout.json`, `.obmap/*` | Membaca `.app/config.json` lebih dulu, fallback otomatis *zero-loss* ke `.vk/*` & `.obmap/*`; ekspor unduhan manual memakai `${brand.slug}-config-${date}.json`. |
| **Scoped CSS, Tokens & Preset (`useThemeStore.ts`, `theme.ts`, `cascadingStyleResolver.ts`)** | `.app-themed-root` / `.vk-themed-root`, `--app-*` / `--vk-*`, `'vk-midnight'` | `.obmap-themed-root`, `obmap-custom-css-snippet`, `--ob-*`, `'obmap-midnight'` | Elemen root memasang kelas dan memproyeksikan token kompatibel (`--app-*` ↔ `--vk-*` ↔ `--ob-*`); `theme.ts` membaca token kanonik lebih dulu lalu fallback legacy; preset midnight dirender dinamis sebagai `${brand.name} Midnight`. |

### 2.4 Lapis 4 — Engine Auto-Rebranding CLI (`scripts/rebrand.ts`)
Menyediakan skrip resmi `bun run rebrand -- --name "<BrandName>" --slug "<slug>" --domain "<domain>" [--dry-run]`:
1. **Target yang Diperbarui Otomatis:** `src/global/config/brand.config.ts`, metadata `package.json`, manifest PWA (`public/manifest.webmanifest` / `vite.config.ts` PWA config bila ada), dokumen aktif (`README.md`, `docs/00-meta/00-0-master-blueprint.md`, `docs/01-visions/*`, `docs/07-developers/*`, `docs/_machine/docs-index.json`), serta mencetak laporan daftar aset visual manual yang perlu diperbarui (`favicon.ico`, `apple-touch-icon.png`, `og-image.png`, logo SVG, dan Supabase OAuth consent screen).
2. **Protected Path Denylist (Wajib Ditolak Script):**
   - `supabase/migrations/**` (dilarang memodifikasi migrasi SQL yang sudah dikunci).
   - `docs/00-meta/00-1-quovadis.md`, `docs/changelogs/archive-wave-1-to-3.md`, dan entri historis `docs/_machine/changelog.jsonl` / `docs/changelogs/*.md` sebelum tanggal eksekusi.
   - Konstanta fallback legacy di `src/global/utils/storageKeyMigrator.ts` dan `RESERVED_SLUGS` historis agar kompatibilitas migrasi data tidak pernah putus.
3. **Mode Wajib `--dry-run`:** Menampilkan *unified diff summary* dan jumlah berkas terdampak sebelum menulis ke disk.

---

## 3. Verifikasi & Hubungan Lintas Dokumen
- Spesifikasi eksekusi terperinci dikelola pada langkah **`BRAND-STEP-01`** di [Playbook Eksekusi (`../../02-planning/README.md`)](../../02-planning/README.md).
- Larangan *hardcode* brand di kode aplikasi dikunci pada [Standar Penulisan Kode (`../../05-engineering/coding-standards.md`)](../../05-engineering/coding-standards.md).
- Peta migrasi storage tercatat pada [Arsitektur Data & Storage (`../data-and-storage.md`)](../data-and-storage.md) dan [Doc Drift Log (`../../05-engineering/doc-drift-log.md`)](../../05-engineering/doc-drift-log.md) (`DRFT-017`).

---

## Terkait
- [Data & Storage (`../data-and-storage.md`)](../data-and-storage.md)
- [ADR-0011: Six-Layer Config & Unified Theme Engine](ADR-0011-six-layer-cascading-config-and-unified-theme-engine.md)
- [Standar Penulisan Kode (`../../05-engineering/coding-standards.md`)](../../05-engineering/coding-standards.md)
- [Playbook Eksekusi (`../../02-planning/README.md`)](../../02-planning/README.md)
