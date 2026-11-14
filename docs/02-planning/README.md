---
id: DOC-PLAN-000
title: Playbook Eksekusi Bertahap & Antrean Implementasi Agen (Step-by-Step Queue)
type: planning
status: [PLANNED]
owner: Principal Software Architect & Lead Product Manager
version: 2.0.0
last_reviewed: 2026-11-14
audience: both
related:
  - DOC-META-000
  - DOC-META-005
  - DOC-PLAN-006
  - DOC-PLAN-007
  - DOC-CHLOG-000
source_of_truth: docs/00-meta/00-2-quovadis.md, src/domains/
---

# Playbook Eksekusi Bertahap & Antrean Implementasi (`docs/02-planning/`)

## Ringkasan 3 Baris
- Pusat kendali operasional agar setiap engineer maupun AI coding agent dapat membaca `docs/02-planning/` dan langsung menentukan langkah pengembangan berikutnya secara gradual tanpa menebak prioritas.
- Mengurutkan seluruh eksekusi kode v2.0 ke dalam **18 langkah atomik** (`STEP-01.1` s/d `STEP-05.4`) lintas **3 Stage Rilis** dan **5 Horizon** yang dikunci oleh 8 Keputusan Arsitektur (`00-2-quovadis.md` §6).
- Setiap langkah mencantumkan prasyarat, domain/berkas terdampak, migrasi SQL yang dibutuhkan, dan *verification gate* wajib sebelum memutakhirkan status serta changelog.

---

## 1. Protokol Operasi Agen LLM (Cara Mengambil Tugas Berikutnya)

Setiap AI coding agent yang memulai sesi pengembangan kode baru wajib mengikuti siklus 6 langkah berikut:
1. **Baca Konteks Cepat:** Baca `AGENTS.md`, 15 baris terakhir `docs/_machine/changelog.jsonl`, dan tabel Antrean Eksekusi pada Bagian 2 dokumen ini.
2. **Pilih Langkah Aktif:** Cari langkah paling awal berstatus `[NEXT]` atau `[IN_PROGRESS]` (atau `[PLANNED]` jika belum ada `[NEXT]`) yang seluruh prasyaratnya berstatus `[IMPLEMENTED]`.
3. **Muat Spesifikasi Langkah:** Baca dokumen terkait pada kolom *Referensi* (`prd.md`, `srs.md`, `brd.md`, ADR terkait, dan `coding-standards.md`).
4. **Implementasi Terisolasi Domain:** Patuhi 11 Aturan Arsitektural di `AGENTS.md` (Headless Controller `<= 300` baris, Pure Zustand Actions, `createSignedUrl` untuk media privat, migrasi SQL eksplisit).
5. **Jalankan Verification Gate:** Verifikasi wajib meliputi `npx vitest run`, `npm run lint`, `npm run build` (bila menyentuh UI/routing), serta uji spesifik pada kolom *Verification Gate*.
6. **Tutup Tugas Secara Atomik:** Ubah status langkah pada tabel Bagian 2 menjadi `[IMPLEMENTED]` (tandai langkah penerusnya menjadi `[NEXT]`), perbarui `docs/05-engineering/doc-drift-log.md` bila ada drift yang ditutup, dan jalankan **Mandatory 3-Part Changelog Sync** (`AGENTS.md` Rule 11).

---

## 2. Antrean Eksekusi Bertahap (Master Step-by-Step Queue)

### Tahap Rilis 1 — `stage_1_partner` (Horizon 1: Fondasi Ketat, Hard Cutover & Closed Partner Pilot)

| Step ID | Status | Epic & ID Ref | Domain / Target Files & Migrations | Spesifikasi Kerja & Verification Gate |
| :--- | :---: | :--- | :--- | :--- |
| **`STEP-01.1`** | `[IMPLEMENTED]` | `EPIC-01`, `TD-005`, `DRFT-011`, `FR-SYS-001` | `src/global/api/supabaseTypes.ts`, `untypedSupabase.ts`, klien `src/domains/*/shared/api/*`, migrasi V4.1 | `untypedSupabase.ts` dijadikan shim re-export bertipe; regenerasi penuh 17 tabel, 2 RPC, & 3 enum Supabase di `supabaseTypes.ts` + migrasi `20261114000000_v4_1_step_01_1_and_01_2_schema_and_reserved_slugs.sql`. **Gate:** `npx tsc --noEmit`, `npx vitest run`, `npm run build` 100% lulus. |
| **`STEP-01.2`** | `[IMPLEMENTED]` | `EPIC-01`, `ADR-0007`, `DRFT-015`, `FR-COMM-001` | **`src/domains/community/`**, `src/App.tsx`, `src/pages/PublicReader.tsx`, `publicUrlHelper.ts`, `ProfileService.ts`, SQL `RESERVED_SLUGS` | Refaktor `src/domains/public-reader/` menjadi `src/domains/community/` (`CommunityOrchestrator.tsx`, `components/`, `shared/`, & barrel shims); **matikan langsung `/p/*`** (*hard cutover* tanpa redirect); daftarkan `/:username/*` (mendukung `/@:username/*`), `/vaults`, & `/explore` dengan guard 3-lapis `RESERVED_SLUGS` di `reservedSlugs.ts`, `ProfileService.ts`, `PublicReaderService.ts`, & constraint DB. **Gate:** `CommunityRouting.test.ts`, `/p/*` tertolak tanpa query DB, Vitest hijau. |
| **`STEP-01.3`** | `[IMPLEMENTED]` | `EPIC-02`, `ADR-0009`, `DRFT-016`, `FR-STAGE-001`–`003` | Migrasi V4.2 (`platform_settings`, `partner_invitations`, `account_status`), `ReleaseStageService.ts`, `AuthProtectedRoute.tsx`, `AdminService.ts`, `AdminReleaseStageBar.tsx` | Implementasi `ReleaseStageGate` (`stage_1_partner`, `stage_2_community_beta`, `stage_3_commercial_ga`); pendaftaran Stage 2 masuk status `pending_approval`; UI switch stage, partner invite, & **approval individual per-user di `/admin`**. **Gate:** `ReleaseStageAndPolicyEngine.test.ts` lulus. |
| **`STEP-01.4`** | `[IMPLEMENTED]` | `EPIC-02`, `ADR-0009`, `ADR-0010`, `DRFT-012`, `FR-VAULT-010` | `policyEngine.ts`, `useVaultPermission.ts`, `NoteService.ts`, `BulkPublishService.ts`, `PublicReaderService.ts`, `CollabSharePublishTab.tsx`, Migrasi V4.2 (`share_links`, `can_access_resource()`) | Evolusi `useVaultPermission.ts` ke `PolicyEngine` simetris dengan Postgres `can_access_resource()`; 4 state visibilitas (`private`, `shared`, `public_unlisted`, `public_listed`); pengecualian frontmatter `visibility: private`; default **`CC BY-SA 4.0`**. **Gate:** `ReleaseStageAndPolicyEngine.test.ts` lulus. |
| **`STEP-01.5`** | `[IMPLEMENTED]` | `EPIC-03`, `ADR-0011`, `DRFT-013`, `FR-SET-001`–`003` | `ConfigService.ts`, `config.types.ts`, `SettingsConfigurationSection.tsx`, `useThemeStore.ts`, `src/domains/graph/shared/utils/theme.ts`, `useGraphCanvasController.ts` | Resolusi 6-Layer Cascading Config (`system → org_policy → vault → user → leaf → session`) dengan indikator *Locked by Admin*; token `--ob-*` DOM↔Canvas2D, Scoped CSS snippet sanitizer `.obmap-themed-root`, & repaint Rule 10 (`graphRef.current?.refresh?.()`). **Gate:** `SixLayerConfigAndTheme.test.ts` lulus. |

### Tahap Rilis 2 — `stage_2_community_beta` (Horizon 2 & 3: Dashboard, Sandbox, Onboarding, Social Graph & Fork/MR)

| Step ID | Status | Epic & ID Ref | Domain / Target Files & Migrations | Spesifikasi Kerja & Verification Gate |
| :--- | :---: | :--- | :--- | :--- |
| **`STEP-02.1`** | `[NEXT]` | `EPIC-04`, `ADR-0008`, `DRFT-007`, `FR-DASH-001`–`005` | **`src/domains/dashboard/`** (Baru), `DashboardOrchestrator.tsx`, `src/App.tsx`, `src/pages/Landing.tsx` | Bangun Domain ke-13 `dashboard` pada `/vaults` dengan 5 *Derived Views* dari Markdown/YAML (*Grid/List, Tree, Kanban, Calendar/Timeline, Analytics*) serta Template Gallery; alihkan redirect pasca-login `Landing.tsx` dari `/app` ke `/vaults`. **Gate:** Semua komponen `<= 300` baris, render Kanban/Calendar konsisten dengan `.md`. |
| **`STEP-02.2`** | `[PLANNED]` | `EPIC-05`, `FR-GROWTH-001` | `src/pages/Landing.tsx`, driver `InMemoryVaultDriver` (`src/domains/vault/`) | Rombak `Landing.tsx` dengan narasi 5 referensi, lazy-loaded Embedded Live Sandbox (`< 65KB` gzipped: outline → Mindmap/Fishbone/Timeline instan), showcase `/:username`, dan CTA adaptif `release_stage`. **Gate:** Bundle chunk sandbox `< 65KB`, LCP `< 2.0s`. |
| **`STEP-02.3`** | `[PLANNED]` | `EPIC-06`, `FR-GROWTH-002`–`004` | `src/domains/auth/`, `src/domains/workspace/`, `LocalConfigStore.ts`, `CloudConfigStore.ts` | Implementasi 5-Stage Hybrid Onboarding (*Benefits Splash + Skip → Migrasi Karya Sandbox ke Vault Pertama → Approval/Waitlist Wait State → Personalization Survey → Guided Tour `<=5` langkah + Coach Marks*). **Gate:** E2E alur Sandbox → Signup → Migrasi catatan berhasil pasca-approval. |
| **`STEP-03.1`** | `[PLANNED]` | `EPIC-07`, `ADR-0007`, `FR-COMM-002`–`004` | `src/domains/community/`, `src/domains/admin/`, SQL (`scholar_profiles`, `scholar_follows`, `vault_topics`, `scholar_verifications`) | Bangun halaman profil `/:username` (bio, ORCID, Konstelasi Vault, Impact Index), direktori kurasi `/explore`, *Follow Scholar/Topic*, OG Card dinamis, dan UI **kurasi manual *Verified Scholar* oleh Admin di `/admin`**. **Gate:** Uji SSR/OG metadata, filter `/explore`, & toggle verifikasi Admin. |
| **`STEP-03.2`** | `[PLANNED]` | `EPIC-08`, `ADR-0010`, `FR-COMM-005` | `src/domains/metadata/shared/api/mentions.worker.ts`, `EditorPropertiesPanel.tsx`, SQL `cross_vault_citations` | Parser `[[@username/vault/note]]` di Worker; skema YAML `epistemic_status`, `confidence`, `doi`, `license: CC BY-SA 4.0`, `references`; tombol *"Cite this Note"* (APA, MLA, IEEE, BibTeX, Wikilink). **Gate:** Uji unit parser federated wikilink `< 100ms` & output format sitasi valid. |
| **`STEP-03.3`** | `[PLANNED]` | `EPIC-09`, `ADR-0010`, `FR-COMM-006` | `src/domains/vcs/`, `src/domains/community/`, SQL (`vault_forks`, `knowledge_merge_requests`, `note_annotations`) | Fitur *Fork to My Vault* untuk vault berstatus publik (`CC BY-SA 4.0`), *Knowledge Merge Request* lintas pengguna memakai `vcsDiffEngine.ts`, serta komentar & anotasi terikat hash paragraf/simpul. **Gate:** Uji E2E Fork → Edit → Submit MR → Review & Merge lintas dua akun `approved`. |

### Tahap Rilis 3 — `stage_3_commercial_ga` (Horizon 4 & 5: Dynamic Billing/Quotas, Teamspaces, CRDT, LMS & `@obmap/sdk`)

| Step ID | Status | Epic & ID Ref | Domain / Target Files & Migrations | Spesifikasi Kerja & Verification Gate |
| :--- | :---: | :--- | :--- | :--- |
| **`STEP-04.1`** | `[PLANNED]` | `EPIC-10`, `ADR-0009`, `FR-BILL-001`–`004` | SQL (`plans`, `plan_entitlements`, `plan_quotas`, `subscriptions`, `usage_quotas`, `billing_invoices`), Supabase Edge Functions (`xendit`/`midtrans`), `useEntitlement()` | Bangun skema entitlement & kuota berbasis DB tanpa angka hardcode; integrasikan **payment gateway Xendit / Midtrans terlebih dahulu** (QRIS, VA, e-Wallet, IDR), diikuti adapter Stripe; implementasi *Non-Destructive Downgrade* (grace 7 hari → `downgraded_readonly`). **Gate:** Uji webhook idempotensi Xendit/Midtrans & batas RLS kuota saat melebihi ambang. |
| **`STEP-04.2`** | `[PLANNED]` | `EPIC-11`, `ADR-0009`, `FR-ADM-010`, `FR-COLLAB-010` | `src/domains/admin/`, `src/domains/collaboration/`, SQL (`org_teamspaces`, `org_seats`) | Panel `/admin` untuk mengonfigurasi **harga paket, fitur, dan batas kuota secara dinamis**, manajemen kupon/beasiswa, serta Teamspaces organisasi dengan *Admin-Locked Policies* & manajemen kursi tim. **Gate:** Perubahan kuota di `/admin` langsung terefleksi di `useEntitlement()` & RLS tanpa deploy ulang kode. |
| **`STEP-04.3`** | `[PLANNED]` | `EPIC-12`, `FR-COLLAB-003` | `src/domains/collaboration/`, `src/domains/sync/`, `src/domains/vcs/` | Sinkronisasi multi-kursor real-time CRDT (Yjs) untuk Team/Lab sembari menjaga kompatibilitas penuh mode offline *IndexedDB / FS Access API*. **Gate:** Uji rekonsiliasi dua klien offline → online tanpa kehilangan teks Markdown. |
| **`STEP-05.1`** | `[PLANNED]` | `EPIC-13`, `FR-LMS-001`–`004` | Modul LMS (`src/domains/graph/`, `src/domains/metadata/`, `src/domains/community/`) | Evaluator DAG `prerequisites` frontmatter pada graf Canvas2D, state simpul (*Locked / Available / Mastered*), animasi progres, kuis pemahaman terintegrasi, & publikasi modul kursus di `/:username`. **Gate:** Deteksi siklus DAG (`cycle rejection`) & kalkulasi persentase progres akurat. |
| **`STEP-05.2`** | `[PLANNED]` | `EPIC-14`, `ADR-0003`, `FR-GRAPH-010`–`012` | `src/domains/graph/shared/utils/layoutCategory.ts`, modul ekspor | Tambah 2 solver deterministik baru (`argument-map` dan `citation-tree`), *Pitch Mode* presentasi kanvas, serta ekspor PDF, SVG, dan OPML. **Gate:** Kedua solver 100% deterministik (koordinat reprodusibel) & `60 FPS` pada 2.000 node. |
| **`STEP-05.3`** | `[PLANNED]` | `EPIC-15`, `ADR-0012`, `FR-EXT-001`–`003` | `src/domains/settings/shared/api/pluginRegistry.ts`, `docs/07-developers/` | Evolusi `pluginRegistry.ts` menjadi `@obmap/sdk` ber-sandbox Web Worker / Iframe CSP, *Permission Manifest*, *Scoped CSS Snippets* (`rehype-sanitize`), 12 Extension Points, dan Allowlist Enterprise. **Gate:** Uji isolasi keamanan menolak plugin tanpa izin akses filesystem/network. |
| **`STEP-05.4`** | `[PLANNED]` | `NFR-001`–`008` | Seluruh domain, Playwright E2E, i18n, audit security | Hardening Stage 3 GA: uji E2E penuh Stage 1–3, kamus i18n lengkap `id-ID` & `en-US`, kepatuhan WCAG 2.2 AA, audit OWASP ASVS L2, dan verifikasi SLO `99.9%`. **Gate:** 100% Vitest + Playwright + Security Check hijau sebelum rilis komersial publik. |

---

## 3. Aturan Pemeliharaan Antrean
- Agen **dilarang** melompati langkah yang memiliki prasyarat belum selesai (`[PLANNED]`) kecuali mendapat instruksi eksplisit dari pemilik proyek untuk mengeksekusi jalur paralel yang tidak berbagi skema SQL.
- Bila sebuah langkah membutuhkan pemecahan sub-tugas lebih kecil atau memunculkan risiko arsitektur baru, catat pembaruannya pada dokumen ini beserta `docs/changelogs/YYYY-MM.md`.

---

## Terkait
- [ObMap Quo Vadis v2.0 (Keputusan Terkunci §6)](../00-meta/00-2-quovadis.md)
- [Peta Roadmap & Horizon (`roadmap.md`)](roadmap.md)
- [Matriks Keterlacakan (`traceability-matrix.md`)](traceability-matrix.md)
- [Product Requirements Document (`prd.md`)](prd.md)
- [System Requirements Specification (`srs.md`)](srs.md)
