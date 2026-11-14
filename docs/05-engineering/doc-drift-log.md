---
id: ENG-DRIFT-001
title: Log Penyelarasan Perbedaan Kode dan Asumsi (Doc Drift Log)
type: engineering
status: [IMPLEMENTED]
owner: Principal Software Architect
version: 2.0.0
last_reviewed: 2026-11-14
audience: both
related:
  - DOC-META-000
  - DOC-META-004
  - DOC-META-005
  - ENG-RULES-001
source_of_truth: git status, git log, src/App.tsx, docs/
---

# Log Penyelarasan Asumsi vs Realitas Kode

## Ringkasan 3 Baris
- Mencatat seluruh selisih antara materi instruksi/dokumen lama dengan kondisi riil kode sumber saat ini.
- Memastikan fakta kode menjadi satu-satunya sumber kebenaran teknis tanpa asumsi yang tertinggal.
- Menyimpan arsip audit link, ADR, dan path kode Wave 3 serta daftar drift v2.0 (`DRFT-006` s/d `DRFT-016`).

---

## 1. Daftar Perbedaan yang Ditemukan (Drift Register)

| ID Drift | Item / Asumsi Lama | Realitas Kode Aktual | Analisis & Status Tindakan |
| :--- | :--- | :--- | :--- |
| **DRFT-001** | Nama repositori diasumsikan `obmap-mdst`. | Nama repositori dan path kerja adalah `obmap-meed`. Nilai `package.json` bernilai `vite_react_shadcn_ts`. | **Diselaraskan.** Dokumentasi menggunakan `obmap-meed`. `package.json` diusulkan untuk diperbarui namanya pada fase pembersihan. |
| **DRFT-002** | Folder bersama bernama `src/shared/`. | Folder bersama telah dipindahkan menjadi `src/global/`. Subfolder `shared/` kini berstatus privat di dalam masing-masing domain (`src/domains/*/shared/`). | **Diselaraskan.** Seluruh referensi dokumentasi diwajibkan menggunakan `@/global/...`. |
| **DRFT-003** | Algoritma Timeline berbasis tanggal pembuatan note (`node.time`). | Algoritma Timeline telah direfaktor menjadi berbasis hierarki struktur file/folder vault (`timeline.ts`), di mana milestone adalah anak langsung dan detail adalah keturunannya. | **Diselaraskan.** Spesifikasi layout engine mencatat tata letak berbasis hierarki direktori. |
| **DRFT-004** | Komponen graf masih memiliki file legacy ganda (misal `BacklinksPanel.tsx` dan `GraphBacklinksPanel.tsx`). | Telah dilakukan migrasi ke komponen berawalan domain (`Graph*`), namun beberapa file lama masih tersisa di disk. | **Dicatat.** Terdaftar di `tech-debt-register.md` sebagai target pembersihan berkas stale. |
| **DRFT-005** | Test runner diasumsikan Bun test. | Test suite dikonfigurasi resmi dengan **Vitest v3** (`npm test` menjalankan `vitest run`). | **Diselaraskan.** Perintah resmi pada dokumentasi pengujian adalah `npm test` atau `npx vitest run`. |
| **DRFT-006** | `00-1-quovadis.md` menulis `TD-001`–`TD-004` & `TD-006` sebagai backlog Horizon 1. | `tech-debt-register.md` & kode sumber membuktikan `TD-001`–`TD-004`, `TD-006`, & `TD-007` sudah `[IMPLEMENTED]` (`OVER_300=0`). | **Diselaraskan.** `00-1-quovadis.md` dibekukan sebagai arsip; status aktual dicatat di `00-2-quovadis.md`. |
| **DRFT-007** | `AGENTS.md` menyebut rute `/vaults` untuk dashboard. | `src/App.tsx` baru mendaftarkan `/`, `/auth`, `/install`, `/p/*`, `/admin`, `/app`; `Landing.tsx` me-redirect ke `/app`. | **Ditargetkan (`EPIC-04` / `STEP-02.1`).** Rute `/vaults` ditandai `[PLANNED]` di `AGENTS.md`. |
| **DRFT-008** | `llms.txt` menunjuk `docs/SUMMARY.md` sebagai Portal Dokumentasi. | `docs/SUMMARY.md` sebelumnya berisi teks laporan audit dan `docs/README.md` belum tersedia. | **Diselaraskan (2026-11-14).** Portal dipulihkan di `docs/README.md` & `docs/SUMMARY.md`; detail audit dipindahkan ke dokumen ini. |
| **DRFT-009** | Direktori `docs/01-visions/` memakai huruf `s`, sedangkan tautan di `brd.md:12`, `personas.md:8`, `lms-vision.md:15`, dan `docs-index.json` menunjuk `01-vision/`. | Sebelumnya menyebabkan 3 broken link Markdown dan 4 path mismatch pada JSON mesin. | **Diselaraskan (Wave `G2`/`G5`/`G7`).** Semua tautan & `docs-index.json` telah diseragamkan ke `01-visions/`. |
| **DRFT-010** | Nama 5 file ADR di `docs/_machine/docs-index.json` tidak cocok dengan disk (mis. `ADR-0001-multi-storage-strategy.md`). | Berkas riil di `docs/03-architecture/adr/` adalah `ADR-0001-domain-driven-design-restructuring.md` s/d `ADR-0006` + `ADR-0007`..`0012`. | **Diselaraskan (Wave `G4`/`G7`).** `adr/README.md`, `llms.txt`, dan `docs-index.json` disinkronkan 1:1 ke nama file fisik. |
| **DRFT-011** | `src/global/api/untypedSupabase.ts` (`TD-005`) masih digunakan. | Seluruh 12 caller beralih ke `supabaseClient.ts`, `supabaseTypes.ts` merefleksikan 17 tabel V4/V4.1, & `untypedSupabase.ts` menjadi shim bertipe. | **Diselaraskan (`STEP-01.1`, `CHG-20261114-003`).** |
| **DRFT-012** | `useVaultPermission.ts` diasumsikan menangani seluruh RBAC kolaborasi. | `PolicyEngine` (`policyEngine.ts`) + SQL `can_access_resource()` aktif beserta peran `commenter`/`guest`, 4-state visibilitas, eksklusi `visibility: private`, & lisensi default `CC BY-SA 4.0`. | **Diselesaikan (`STEP-01.4`, `CHG-20261114-004`).** |
| **DRFT-013** | Registry internal `configRegistry.ts`, `pluginRegistry.ts`, & `schemaRegistry.ts` ada di `src/domains/settings/shared/api/`. | Resolusi 6-lapis (`ConfigService`), indikator *Locked by Admin*, Scoped CSS sanitizer, & jembatan token `--ob-*` DOM↔Canvas2D kini aktif. | **Diselesaikan untuk Config/Theme (`STEP-01.5`, `CHG-20261114-004`)**; SDK sandbox di `STEP-05.3`. |
| **DRFT-014** | `docs/02-planning/brd.md` memakai placeholder `{{TBD_PRO_PRICE}}`. | Sebelumnya belum mencerminkan model XMind+Notion dan tarif dinamis Admin. | **Diselaraskan (Wave `G3`).** Digantikan model tarif/kuota dinamis di `/admin` (`plans`, `plan_quotas`) & gateway **Xendit/Midtrans** first di `brd.md`. |
| **DRFT-015** | `src/App.tsx` & `publicUrlHelper.ts` memakai rute `/p/:username/:vaultSlug`. | `src/domains/community/` aktif dengan `CommunityOrchestrator`, rute root `/:username` / `/@:username`, guard 3-lapis `RESERVED_SLUGS`, & `/p/*` dimatikan langsung. | **Diselaraskan (`STEP-01.2`, `CHG-20261114-003`).** |
| **DRFT-016** | `src/domains/auth/` mengizinkan akses langsung setelah signup. | `ReleaseStageService` (`stage_1_partner`/`stage_2_community_beta`/`stage_3_commercial_ga`), `AuthProtectedRoute`, & antrean approval individual `/admin` aktif. | **Diselesaikan (`STEP-01.3`, `CHG-20261114-004`).** |

---

## 2. Arsip Audit Path Kode Pra-Wave 3 `[RESOLVED — Waves G5/G7]`

Tujuh referensi `source_of_truth` pada `docs/04-features/feature-catalog.md` dan `docs/_machine/features.json` yang sebelumnya memakai path pra-Wave 3 telah diselaraskan pada gelombang `G5`/`G7`:

| Fitur / Komponen | Path Tertulis di Dokumen Lama | Path Aktual di Repositori |
| :--- | :--- | :--- |
| Vault Manager | `src/domains/vault/shared/services/VaultManager.ts` | `src/domains/vault/shared/api/VaultManager.ts` |
| Import Export | `src/domains/vault/shared/services/ImportExportService.ts` | `src/domains/vault/shared/api/ImportExportService.ts` |
| Vault Lifecycle | `src/domains/vault/shared/hooks/useVaultLifecycle.ts` | `src/domains/workspace/shared/hooks/useVaultLifecycle.ts` |
| Properties Panel | `src/domains/editor/components/PropertiesPanel.tsx` | `src/domains/editor/components/EditorPropertiesPanel.tsx` |
| Editor Setup | `src/domains/editor/shared/cm/setup.ts` | `src/domains/editor/shared/utils/cmSetup.ts` |
| Layout Algorithms | `src/domains/graph/shared/utils/layoutAlgorithms.ts` | `src/domains/graph/shared/utils/{treeLayouts,mindmap,timeline,fishbone}.ts` |
| Migrasi Supabase | `supabase/migrations/20261001000000_storage_and_permissions.sql` | `supabase/migrations/20261031000000_v4_collaboration_and_publishing.sql` |

---

## Terkait
- [Aturan Repositori](repository-rules.md)
- [Quo Vadis v2.0 Execution Plan](../00-meta/00-2-quovadis.md)
- [Modular Changelog Hub](../changelogs/README.md)
