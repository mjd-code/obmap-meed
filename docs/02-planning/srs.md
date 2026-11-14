---
id: DOC-PLAN-003
title: System Requirements Specification (SRS) ObMap v2.0
type: planning
status: [PLANNED]
owner: Principal Software Architect
version: 2.0.0
last_reviewed: 2026-11-14
audience: engineering
related:
  - DOC-META-000
  - DOC-PLAN-000
  - DOC-PLAN-001
  - DOC-PLAN-007
  - DOC-ARCH-001
source_of_truth: src/domains/, supabase/migrations/
---

# System Requirements Specification (SRS) ObMap v2.0

## Ringkasan 3 Baris
- Menjabarkan kebutuhan fungsional (`FR-*`) dan non-fungsional (`NFR-*`) terverifikasi untuk seluruh 13 domain ObMap v2.0 (termasuk `community` hasil refaktor `public-reader` serta domain baru `dashboard`).
- Menghilangkan *path drift* lama dengan merujuk lokasi modul aktual (`src/global/api/untypedSupabase.ts`, `layoutCategory.ts`, `src/domains/settings/`).
- Setiap kode kebutuhan (`FR-*` / `NFR-*`) dipetakan langsung ke langkah eksekusi `STEP-01.1` s/d `STEP-05.4` dan gerbang uji otomatis.

---

## 1. Kebutuhan Fungsional Inti (Wave 1–3 Baseline & Evolution)

| Req ID | Domain | Spesifikasi Teknis Terukur | Status | Step |
| :--- | :--- | :--- | :---: | :--- |
| **`FR-SYS-001`** | `global` | Hapus `src/global/api/untypedSupabase.ts` (`TD-005`) dan regenerasi tipe TypeScript ketat dari `supabase/migrations/20261031000000_v4_collaboration_and_publishing.sql` + migrasi baru. | `[PLANNED]` | `STEP-01.1` |
| **`FR-EDITOR-001`** | `editor` | Isolasi editor Markdown CM6 (`EditorMarkdownView.tsx`) dari editor YAML Frontmatter terstruktur (`EditorPropertiesPanel.tsx`). | `[IMPLEMENTED]` | Baseline |
| **`FR-GRAPH-001`** | `graph` | Menjalankan simulasi D3 hanya pada `Free-Force`; menjaga `Mindmap`, `Org`, `Timeline`, dan `Fishbone` deterministik (`layoutCategory.ts`) dengan isolasi store per-tab (`LeafGraphConfigStore`). | `[IMPLEMENTED]` | Baseline |
| **`FR-GRAPH-010`** | `graph` | Tambah solver deterministik `argument-map` dan `citation-tree` pada `layoutCategory.ts`. | `[PLANNED]` | `STEP-05.2` |
| **`FR-GRAPH-011`** | `graph` | *Pitch Mode* presentasi terurut dari cabang kanvas & adaptor ekspor PDF, SVG, serta OPML. | `[PLANNED]` | `STEP-05.2` |
| **`FR-META-001`** | `metadata` | Indeks `[[wikilinks]]`, tags, dan frontmatter via Aho-Corasick Web Worker (`mentions.worker.ts`) dalam `< 100ms` tanpa memblokir UI thread. | `[IMPLEMENTED]` | Baseline |
| **`FR-VAULT-001`** | `vault` | Abstraksi penyimpanan lewat `IVaultStorageDriver.ts` (`FileSystemService.ts`, `IndexedDbVaultDriver.ts`, `CloudVaultService.ts`) dan `ImportExportService.ts`. | `[IMPLEMENTED]` | Baseline |
| **`FR-VAULT-010`** | `vault`, `collaboration` | State Machine 4 visibilitas (`Private`, `Shared`, `Public Unlisted`, `Public Listed`), override YAML `visibility: private`, lisensi default `CC BY-SA 4.0`, dan Unified Share Modal (`share_links`). | `[PARTIAL]` | `STEP-01.4` |

---

## 2. Kebutuhan Fungsional Stage Gate, RBAC, Community & Dashboard (`v2.0`)

| Req ID | Domain | Spesifikasi Teknis Terukur | Status | Step |
| :--- | :--- | :--- | :---: | :--- |
| **`FR-STAGE-001`** | `auth`, `admin` | Tabel `platform_settings` menyimpan `release_stage` (`stage_1_partner` \| `stage_2_community_beta` \| `stage_3_commercial_ga`). | `[VISION]` | `STEP-01.3` |
| **`FR-STAGE-002`** | `auth`, `admin` | Stage 1 hanya mengizinkan login melalui token `partner_invitations` atau provisi Admin di `/admin`. | `[VISION]` | `STEP-01.3` |
| **`FR-STAGE-003`** | `auth`, `admin` | Stage 2 menempatkan akun baru ke `account_status = 'pending_approval'`; hanya Admin yang menyetujui **secara individual per-user di `/admin`**. | `[VISION]` | `STEP-01.3` |
| **`FR-AUTH-010`** | `auth` | Refaktor `useVaultPermission.ts` menjadi `PolicyEngine` (`can(actor, action, resource, context)`) simetris dengan Postgres RLS `can_access_resource()`, termasuk `audit_logs`. | `[PARTIAL]` | `STEP-01.4` |
| **`FR-COMM-001`** | `community`, `settings` | Refaktor `src/domains/public-reader/` → `src/domains/community/` (`CommunityOrchestrator.tsx`); matikan `/p/*` (*hard cutover*); daftarkan `/:username/*` & `/@:username/*` dengan `RESERVED_SLUGS` di router, `ProfileService.ts`, dan DB. | `[PLANNED]` | `STEP-01.2` |
| **`FR-COMM-002`** | `community` | Halaman Profil Cendekiawan `/:username` menampilkan bio, afiliasi/ORCID, Konstelasi Vault Publik (`CC BY-SA 4.0`), dan Statistik Dampak Sitasi. | `[VISION]` | `STEP-03.1` |
| **`FR-COMM-003`** | `community` | Direktori `/explore` untuk penemuan topik kurasi, grafik tren, dan *Follow Scholar / Topic* (`scholar_follows`). | `[VISION]` | `STEP-03.1` |
| **`FR-COMM-004`** | `community`, `admin` | Lencana *Verified Scholar / Educator / Institution* dikurasi secara manual oleh Admin melalui `/admin`. | `[VISION]` | `STEP-03.1` |
| **`FR-COMM-005`** | `community`, `metadata`, `editor` | Parser `[[@username/vaultSlug/noteSlug]]` di `mentions.worker.ts`, properti YAML `epistemic_status`/`doi`/`license`/`references`, tabel `cross_vault_citations`, & tombol *Cite* (APA/MLA/IEEE/BibTeX). | `[VISION]` | `STEP-03.2` |
| **`FR-COMM-006`** | `community`, `vcs` | *Fork to My Vault*, pengajuan *Knowledge Merge Request* lintas pengguna memakai `vcsDiffEngine.ts`, serta anotasi paragraf terikat hash (`note_annotations`). | `[PARTIAL]` | `STEP-03.3` |
| **`FR-DASH-001`** | `dashboard` | Bangun `src/domains/dashboard/` (`DashboardOrchestrator.tsx`, `DashboardWidgetRegistry.ts`) untuk `/vaults`; alihkan redirect login di `Landing.tsx` dari `/app` ke `/vaults`. | `[VISION]` | `STEP-02.1` |
| **`FR-DASH-002`** | `dashboard` | Lima mode *Derived Views* dari Markdown + YAML frontmatter: *Grid/List*, *Knowledge Tree*, *Kanban*, *Calendar/Timeline*, dan *Analytics* + Template Gallery & Community Feed. | `[VISION]` | `STEP-02.1` |

---

## 3. Kebutuhan Fungsional Growth, Dynamic Billing, Config, LMS & SDK

| Req ID | Domain | Spesifikasi Teknis Terukur | Status | Step |
| :--- | :--- | :--- | :---: | :--- |
| **`FR-GROWTH-001`** | `pages`, `vault` | Landing Page `/` dengan narasi 5 referensi, lazy-loaded *In-Memory Sandbox* `< 65KB` gzipped, showcase `/:username`, dan CTA adaptif `release_stage`. | `[PARTIAL]` | `STEP-02.2` |
| **`FR-GROWTH-002`** | `auth`, `workspace` | Onboarding Hibrida 5-Tahap: Splash + Skip → Migrasi catatan Sandbox → Approval/Waitlist State → Survey → Guided Tour `<= 5` langkah + Coach Marks. | `[PLANNED]` | `STEP-02.3` |
| **`FR-BILL-001`** | `admin`, `supabase` | Skema DB dinamis `plans`, `plan_entitlements`, `plan_quotas`, `subscriptions`, `usage_quotas`, `billing_invoices` — nol konstanta harga/kuota hardcode di klien. | `[VISION]` | `STEP-04.1` |
| **`FR-BILL-002`** | `supabase` | Integrasi webhook pembayaran memprioritaskan **Xendit / Midtrans terlebih dahulu** (QRIS, VA, e-Wallet, IDR), diikuti adapter Stripe. | `[VISION]` | `STEP-04.1` |
| **`FR-BILL-003`** | `global`, `vault` | Hook `useEntitlement()`, komponen `<FeatureGate>`, penegakan kuota RLS & Edge Functions, serta *Non-Destructive Downgrade* (Grace 7 hari → `downgraded_readonly`). | `[VISION]` | `STEP-04.1` |
| **`FR-ADM-010`** | `admin` | Konsol `/admin` lengkap: Approval per-user Stage 2, edit harga & kuota dinamis paket, kurasi *Verified Scholar*, kupon/beasiswa, & override akun. | `[VISION]` | `STEP-04.2` |
| **`FR-COLLAB-003`** | `collaboration`, `sync` | Sinkronisasi CRDT (Yjs) multi-kursor real-time untuk Team/Lab tanpa memutus mode offline `IndexedDB` / `FS Access API`. | `[VISION]` | `STEP-04.3` |
| **`FR-COLLAB-010`** | `collaboration`, `admin` | Teamspaces organisasi dengan *Admin-Locked Config* dan manajemen seat (`org_teamspaces`, `org_seats`). | `[VISION]` | `STEP-04.2` |
| **`FR-SET-001`** | `settings` | Resolusi 6-Layer Cascading Config (*System → Org Locked → Vault `.obmap/` → User → Leaf → Session*) melalui `configRegistry.ts`, `LocalConfigStore.ts`, `CloudConfigStore.ts`. | `[PARTIAL]` | `STEP-01.5` |
| **`FR-SET-002`** | `settings`, `graph` | Unified Theme Engine menghubungkan `useThemeStore.ts` (CSS Variables DOM) dengan `graph/shared/utils/theme.ts` & `atmosphereConfig.ts` secara reaktif (`refresh()`). | `[PARTIAL]` | `STEP-01.5` |
| **`FR-LMS-001`** | `graph`, `community` | Evaluator DAG `prerequisites` YAML pada kanvas (deteksi siklus), state simpul (*Locked / Available / Mastered*), progres pelajar, & kuis integratif. | `[VISION]` | `STEP-05.1` |
| **`FR-EXT-001`** | `settings` | SDK `@obmap/sdk` ber-sandbox Web Worker / Iframe CSP, manifest izin eksplisit, *Scoped CSS Snippets* (`rehype-sanitize`), dan 12 Extension Points standar. | `[PARTIAL]` | `STEP-05.3` |

---

## 4. Kebutuhan Non-Fungsional (`NFR-001` s/d `NFR-008`)

| ID | Kategori | Metrik & Batas Kepatuhan Target | Status Verifikasi |
| :--- | :--- | :--- | :--- |
| **`NFR-001`** | **Performa Canvas2D** | `60 FPS` pada graf `2.000` node dan `>= 30 FPS` pada `5.000` node; Aho-Corasick indexing `< 100ms` di Web Worker. | `[PARTIAL]` |
| **`NFR-002`** | **Web Vitals & Bundle** | `/`, `/:username`, & `/explore` LCP `< 2.0s`, CLS `< 0.05`; initial JS bundle `< 250KB` gzipped; Sandbox Landing `< 65KB` gzipped. | `[PARTIAL]` |
| **`NFR-003`** | **Keamanan & RLS** | Kepatuhan OWASP ASVS L2; media privat wajib via `createSignedUrl`; uji integrasi Postgres RLS untuk seluruh peran & 4 state visibilitas. | `[PARTIAL]` |
| **`NFR-004`** | **Sanitasi Konten Publik** | Render Markdown & *Scoped CSS Snippets* di `community` melewati `rehype-sanitize` (0 celah XSS). | `[PARTIAL]` |
| **`NFR-005`** | **Arsitektur & Kualitas Kode** | `0` komponen `.tsx` > 300 baris (`OVER_300=0`); Headless Controller `ADR-0006`; `0` warning `npm run lint`. | `[IMPLEMENTED]` (Wave 3), Dijaga kontinyu |
| **`NFR-006`** | **Type Safety** | TypeScript strict mode (`npx tsc --noEmit`) dengan `0` error; penghapusan penuh `untypedSupabase.ts`. | `[PARTIAL]` (`STEP-01.1`) |
| **`NFR-007`** | **Aksesibilitas & i18n** | Kepatuhan WCAG 2.2 Level AA, navigasi keyboard lengkap (`Tab`/`Enter`/`Space`), dan kamus lengkap `id-ID` serta `en-US`. | `[PARTIAL]` (`STEP-05.4`) |
| **`NFR-008`** | **Reliabilitas & Observabilitas** | Ketersediaan SLO `99.9%`, Point-in-Time Recovery (PITR) PostgreSQL, `audit_logs` terstruktur, & *Zero Data Loss* pada downgrade. | `[VISION]` (`STEP-05.4`) |

---

## Terkait
- [Playbook Eksekusi Step-by-Step (`README.md`)](README.md)
- [Product Requirements Document (`prd.md`)](prd.md)
- [Matriks Keterlacakan (`traceability-matrix.md`)](traceability-matrix.md)
- [Strategi Pengujian (`testing-strategy.md`)](../05-engineering/testing-strategy.md)
